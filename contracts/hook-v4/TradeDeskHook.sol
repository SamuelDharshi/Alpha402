// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "@uniswap/v4-periphery/src/base/hooks/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import "./StrategyVault.sol";

contract TradeDeskHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    StrategyVault public immutable vault;
    
    mapping(PoolId => bytes32) public poolStrategies;

    event SwapExecuted(bytes32 indexed strategyId, address tokenIn, address tokenOut, uint128 amountIn, uint128 amountOut);

    constructor(IPoolManager _poolManager, address _vault) BaseHook(_poolManager) {
        vault = StrategyVault(payable(_vault));
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function setPoolStrategy(PoolKey calldata key, bytes32 strategyId) external {
        // In production, add access control
        poolStrategies[key.toId()] = strategyId;
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        bytes32 strategyId = poolStrategies[key.toId()];
        
        // If hookData is provided, it might contain a specific strategyId for this swap
        if (hookData.length == 32) {
            strategyId = abi.decode(hookData, (bytes32));
        }

        if (strategyId != bytes32(0)) {
            uint256 amount = params.amountSpecified < 0 
                ? uint256(-params.amountSpecified) 
                : uint256(params.amountSpecified);
            
            require(
                vault.authoriseExecution(strategyId, amount, tx.gasprice),
                "TradeDesk: Not authorised or limits exceeded"
            );
        }

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        bytes32 strategyId = poolStrategies[key.toId()];
        if (hookData.length == 32) {
            strategyId = abi.decode(hookData, (bytes32));
        }

        if (strategyId != bytes32(0)) {
            emit SwapExecuted(
                strategyId,
                params.zeroForOne ? address(key.currency0) : address(key.currency1),
                params.zeroForOne ? address(key.currency1) : address(key.currency0),
                params.amountSpecified < 0 ? uint128(-params.amountSpecified) : uint128(params.amountSpecified),
                params.zeroForOne ? uint128(delta.amount1()) : uint128(delta.amount0())
            );
        }

        return (BaseHook.afterSwap.selector, 0);
    }
}
