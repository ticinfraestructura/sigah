const fs = require('fs');

function extractDataFromBackup() {
  console.log('🔍 Analizando backup de PostgreSQL...');
  
  const sqlContent = fs.readFileSync('./restore.sql', 'utf8');
  
  // Extraer beneficiarios
  const beneficiariesMatch = sqlContent.match(/COPY public\.beneficiaries.*?FROM stdin;([\s\S]*?)\\\./);
  if (beneficiariesMatch) {
    const beneficiaries = beneficiariesMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`👥 Beneficiarios encontrados: ${beneficiaries.length}`);
    beneficiaries.slice(0, 3).forEach((line, i) => {
      const fields = line.split('\t');
      if (fields.length >= 5) {
        console.log(`   ${i+1}. ${fields[3]} ${fields[4]} (${fields[2]})`);
      }
    });
  }
  
  // Extraer productos
  const productsMatch = sqlContent.match(/COPY public\.products.*?FROM stdin;([\s\S]*?)\\\./);
  if (productsMatch) {
    const products = productsMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`📦 Productos encontrados: ${products.length}`);
    products.slice(0, 5).forEach((line, i) => {
      const fields = line.split('\t');
      if (fields.length >= 3) {
        console.log(`   ${i+1}. ${fields[2]} (${fields[1]})`);
      }
    });
  }
  
  // Extraer categorías
  const categoriesMatch = sqlContent.match(/COPY public\.categories.*?FROM stdin;([\s\S]*?)\\\./);
  if (categoriesMatch) {
    const categories = categoriesMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`🏷️ Categorías encontradas: ${categories.length}`);
    categories.forEach((line, i) => {
      const fields = line.split('\t');
      if (fields.length >= 2) {
        console.log(`   ${i+1}. ${fields[1]}`);
      }
    });
  }
  
  // Extraer kits
  const kitsMatch = sqlContent.match(/COPY public\.kits.*?FROM stdin;([\s\S]*?)\\\./);
  if (kitsMatch) {
    const kits = kitsMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`📦 Kits encontrados: ${kits.length}`);
    kits.slice(0, 3).forEach((line, i) => {
      const fields = line.split('\t');
      if (fields.length >= 3) {
        console.log(`   ${i+1}. ${fields[2]} (${fields[1]})`);
      }
    });
  }
  
  // Extraer solicitudes
  const requestsMatch = sqlContent.match(/COPY public\.requests.*?FROM stdin;([\s\S]*?)\\\./);
  if (requestsMatch) {
    const requests = requestsMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`📋 Solicitudes encontradas: ${requests.length}`);
  }
  
  // Extraer entregas
  const deliveriesMatch = sqlContent.match(/COPY public\.deliveries.*?FROM stdin;([\s\S]*?)\\\./);
  if (deliveriesMatch) {
    const deliveries = deliveriesMatch[1].trim().split('\n').filter(line => line.trim());
    console.log(`🚚 Entregas encontradas: ${deliveries.length}`);
  }
  
  console.log('✅ Análisis completado');
}

extractDataFromBackup();
