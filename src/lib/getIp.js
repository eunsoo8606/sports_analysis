const axios = require('axios');
const getLocalExternalIP = async function() {
    try {
      const response = await axios.get('http://icanhazip.com');
      const externalIP = response.data.trim();
      console.log('Local External IP:', externalIP);
      return externalIP;
    } catch (error) {
      console.error('Error fetching local external IP:', error);
    }
}

module.exports ={ getLocalExternalIP};