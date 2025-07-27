#!/usr/bin/env node

// Debug script para ver qué devuelve realmente MDBG

async function testMDBGResponse() {
  const character = '人';
  const searchUrl = `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(character)}`;
  
  console.log(`Testing URL: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Educational Chinese Dictionary Tool)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    console.log('Response length:', html.length);
    console.log('First 500 characters:');
    console.log(html.substring(0, 500));
    console.log('\n--- Looking for character data ---');
    
    // Buscar patrones típicos de MDBG
    const patterns = [
      /人.*?\[(.*?)\]/,  // [pinyin]
      /strokes?[:\s]*(\d+)/i,
      /radical[:\s]*([^\s]+)/i,
      /人[^<]*([^<]+)/
    ];
    
    patterns.forEach((pattern, i) => {
      const match = html.match(pattern);
      console.log(`Pattern ${i}:`, match ? match[0] : 'No match');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMDBGResponse();