/**
 * This function wraps async functions to prevent memory leaks and
 * unintended errors in useEffect hooks.
 *
 * If an async function resolves after the component is unmounted,
 * it will throw an error. This function prevents that.
 */
const asyncWrapper = (fn: Function) => {
  let isMounted = true;

  fn();

  return () => {
    isMounted = false;
  };
};

export default asyncWrapper;
