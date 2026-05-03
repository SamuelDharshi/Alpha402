// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Hooks}          from "../lib/v4-core/src/libraries/Hooks.sol";
import {IPoolManager}   from "../lib/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks}         from "../lib/v4-core/src/interfaces/IHooks.sol";
import {PoolKey}        from "../lib/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "../lib/v4-core/src/types/PoolId.sol";
import {BalanceDelta}   from "../lib/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "../lib/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency}       from "../lib/v4-core/src/types/Currency.sol";
import "./StrategyVault.sol";

/**
 * @title Alpha402Hook
 * @notice Uniswap v4 hook that gates swaps through Alpha402 StrategyVault risk checks.
 *
 * Implements IHooks directly (BaseHook was removed in v4-periphery latest).
 *
 * Hook flow:
 *   beforeSwap → calls StrategyVault.authoriseExecution()
 *              → reverts if strategy is paused, exceeds limits, or gas is too high
 *   afterSwap  → emits SwapExecuted event for off-chain agent monitoring
 */
contract Alpha402Hook is IHooks {
    using PoolIdLibrary for PoolKey;

    IPoolManager public immutable poolManager;
    StrategyVault public immutable vault;

    mapping(PoolId => bytes32) public poolStrategies;

    event SwapExecuted(
        bytes32 indexed strategyId,
        address tokenIn,
        address tokenOut,
        uint128 amountIn,
        uint128 amountOut
    );

    error NotPoolManager();
    error Alpha402NotAuthorised(bytes32 strategyId);

    modifier onlyPoolManager() {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        _;
    }

    constructor(IPoolManager _poolManager, address _vault) {
        poolManager = _poolManager;
        vault = StrategyVault(payable(_vault));
    }

    // ── IHooks interface ────────────────────────────────────────────────────────

    function getHookPermissions() public pure returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize:              false,
            afterInitialize:               false,
            beforeAddLiquidity:            false,
            afterAddLiquidity:             false,
            beforeRemoveLiquidity:         false,
            afterRemoveLiquidity:          false,
            beforeSwap:                    true,
            afterSwap:                     true,
            beforeDonate:                  false,
            afterDonate:                   false,
            beforeSwapReturnDelta:         false,
            afterSwapReturnDelta:          false,
            afterAddLiquidityReturnDelta:  false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeInitialize(address, PoolKey calldata, uint160) external pure returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function afterInitialize(address, PoolKey calldata, uint160, int24) external pure returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external pure returns (bytes4)
    { return IHooks.beforeAddLiquidity.selector; }

    function afterAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external pure returns (bytes4, BalanceDelta)
    { return (IHooks.afterAddLiquidity.selector, BalanceDelta.wrap(0)); }

    function beforeRemoveLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external pure returns (bytes4)
    { return IHooks.beforeRemoveLiquidity.selector; }

    function afterRemoveLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, BalanceDelta, BalanceDelta, bytes calldata)
        external pure returns (bytes4, BalanceDelta)
    { return (IHooks.afterRemoveLiquidity.selector, BalanceDelta.wrap(0)); }

    function beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external pure returns (bytes4)
    { return IHooks.beforeDonate.selector; }

    function afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        external pure returns (bytes4)
    { return IHooks.afterDonate.selector; }

    // ── Core logic: beforeSwap & afterSwap ─────────────────────────────────────

    /**
     * @notice Called by PoolManager before every swap on a registered pool.
     *         Calls StrategyVault.authoriseExecution() — reverts if:
     *           • strategy is paused
     *           • trade size > maxPositionWei
     *           • gas price > maxGasGwei
     */
    function beforeSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, BeforeSwapDelta, uint24) {
        bytes32 strategyId = poolStrategies[key.toId()];

        // hookData can carry a per-swap strategyId override
        if (hookData.length == 32) {
            strategyId = abi.decode(hookData, (bytes32));
        }

        if (strategyId != bytes32(0)) {
            uint256 amount = params.amountSpecified < 0
                ? uint256(-params.amountSpecified)
                : uint256(params.amountSpecified);

            if (!vault.authoriseExecution(strategyId, amount, tx.gasprice)) {
                revert Alpha402NotAuthorised(strategyId);
            }
        }

        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /**
     * @notice Called by PoolManager after every swap.
     *         Emits SwapExecuted so off-chain agents can pick up confirmed trades.
     */
    function afterSwap(
        address,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override onlyPoolManager returns (bytes4, int128) {
        bytes32 strategyId = poolStrategies[key.toId()];
        if (hookData.length == 32) {
            strategyId = abi.decode(hookData, (bytes32));
        }

        if (strategyId != bytes32(0)) {
            emit SwapExecuted(
                strategyId,
                Currency.unwrap(params.zeroForOne ? key.currency0 : key.currency1),
                Currency.unwrap(params.zeroForOne ? key.currency1 : key.currency0),
                uint128(params.amountSpecified < 0
                    ? uint256(-params.amountSpecified)
                    : uint256(params.amountSpecified)),
                params.zeroForOne
                    ? uint128(delta.amount1() < 0 ? -delta.amount1() : delta.amount1())
                    : uint128(delta.amount0() < 0 ? -delta.amount0() : delta.amount0())
            );
        }

        return (IHooks.afterSwap.selector, 0);
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    /** Register a strategyId for a given pool. Anyone can call — in production add access control. */
    function setPoolStrategy(PoolKey calldata key, bytes32 strategyId) external {
        poolStrategies[key.toId()] = strategyId;
    }
}
