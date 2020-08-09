const http = require('http');

http.createServer((request, response)=>{
  let body = [];
  request.on('error', (err)=>{
  }).on('data', (chunk)=>{
    // body.push(chunk.toString());
    body.push(Buffer.from(chunk));

  }).on('end', ()=>{
    body = Buffer.concat(body).toString();
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('I am the Cataclysm \n');

  })
}).listen(8081);
