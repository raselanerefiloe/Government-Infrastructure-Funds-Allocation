// ./utils/ConvertWeiToEther
import Web3 from 'web3';

// Helper function to convert Wei to Ether
const convertWeiToEther = (amountInWei) => {
  return Web3.utils.fromWei(amountInWei, 'ether');
};

export default convertWeiToEther;