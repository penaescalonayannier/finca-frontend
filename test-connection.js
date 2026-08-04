const axios = require('axios');

async function testBackendConnection() {
  console.log('🧪 Probando conexión con Spring Boot en localhost:9908...\n');
  
  const tests = [
    { 
      name: 'GET Básico', 
      method: 'get', 
      url: 'http://localhost:9908/api/health' 
    },
    { 
      name: 'Health Check', 
      method: 'get', 
      url: 'http://localhost:9908/api/health' 
    },
    { 
      name: 'API Estado Cuenta Search', 
      method: 'post', 
      url: 'http://localhost:9908/api/estado-cuenta/search',
      data: {
    "filter": [],
    "query": "",
    "pageSize": 20,
    "page": 0,
    "sortBy": "",
    "sortType": "ASC"
}
    }
  ];

  for (const test of tests) {
    try {
      console.log(`➡️  Probando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        data: test.data,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ Éxito: ${response.status} ${response.statusText}`);
      console.log(`   📊 Datos: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.code || error.message}`);
      
      if (error.response) {
        console.log(`   Código: ${error.response.status}`);
        console.log(`   Headers: ${JSON.stringify(error.response.headers)}`);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log('   ⚠️  Spring Boot no está corriendo o está en un puerto diferente');
      } else if (error.code === 'ENETUNREACH') {
        console.log('   ⚠️  No se puede alcanzar el host');
      }
      console.log('');
    }
  }
}

// Si no tienes axios instalado globalmente, ejecuta: npm install axios
testBackendConnection();
