rodar evolutionApi - pm2 start server.js --name meta-ads-bi
rodar dashboard - pm2 start backend/server.js --name dashboard-evolution
salvar - pm2 save
start continuo - pm2 startup
ver status processos - pm2 list
parar api - pm2 stop meta-ads-bi
parar dashboard - pm2 stop dashboard-evolution
reiniciar api - pm2 restart meta-ads-bi
reiniciar dashboard - pm2 restart dashboard-evolution
parar todos - pm2 stop all
reiniciar todos - pm2 restart all