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
    response.end(
      ` <html maaa=a>
        <head>
        <style>
        body div img{
            width: 30px;
            background-color: #ff1111;
        }
        body div img#myid{
            width: 100px;
            background-color: #ff5000;
        }
        </style>
        </head>
        <body>
          <div>
            <img id="myid"/>
            <img/>
          </div>
        </body>
        </html>\``
    );

  })
}).listen(8081);

