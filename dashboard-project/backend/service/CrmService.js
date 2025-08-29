const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const responseFormatter = require('../utils/responseFormatter');

async function getData(req, res) {
  try {
    const response = await fetch('https://graph.facebook.com/v17.0/1971189973702646/leads?access_token=EAAKMZBbIAoCoBPWFfyNZBPoadksuCLohu7YzkNoagZCSO231z8r2r1zMaG9yZC5SjU844bReeMthmQjre4zmj88TcrPX29KouCXD4GK1VqKyk2qfi6TstTbyBu1MZCdQk2UTq3ZCmZAzO9SiEaLyGyj49B22Kg8mZAitgzdvZAyWWWOaIvK4MOZAkAeu6q9ZAT4UVScCtYLCCKoZAf1iJaDW97G1Xwa6WrYiLN1Yiuk5j5wZD');
    const data = await response.json();
    return res.status(200).json(responseFormatter.success(data.data || []));
  } catch (err) {
    return res.status(500).json(responseFormatter.error('Erro ao buscar leads', err));
  }
}

module.exports = { getData };