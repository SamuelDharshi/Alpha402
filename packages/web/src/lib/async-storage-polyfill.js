// Dummy polyfill for @react-native-async-storage/async-storage
const dummyStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
  multiMerge: async () => {},
};

export default dummyStorage;
