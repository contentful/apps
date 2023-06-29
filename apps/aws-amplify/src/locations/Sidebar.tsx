import AmplifyBuildButton from '../components/sidebar/AmplifyBuildButton';

const Sidebar = () => {
  // <Button
  //   variant="primary"
  //   isFullWidth={true}
  //   isLoading={isLoading}
  //   isDisabled={isLoading}
  //   onClick={handleBuildAppActionCall}>
  //   {isLoading ? 'Building' : 'Build website'}
  // </Button>
  return (
    <>
      <AmplifyBuildButton />
    </>
  );
};

export default Sidebar;
