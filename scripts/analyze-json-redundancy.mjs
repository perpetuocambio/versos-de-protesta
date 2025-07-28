#!/usr/bin/env node

/**
 * ANÁLISIS DE REDUNDANCIA JSON
 * =============================
 * 
 * Analiza todos los archivos JSON para identificar redundancia
 * y proponer un sistema simplificado pero completo.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');

console.log('📊 ANÁLISIS DE REDUNDANCIA JSON');
console.log('===============================');

function findAllJsonFiles() {
    const jsonFiles = [];
    
    function scanDir(dir) {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (entry.endsWith('.json')) {
                const relativePath = path.relative(DATA_DIR, fullPath);
                const size = Math.round(stat.size / 1024);
                jsonFiles.push({
                    path: relativePath,
                    fullPath,
                    size,
                    category: categorizeFile(relativePath)
                });
            }
        }
    }
    
    scanDir(DATA_DIR);
    return jsonFiles;
}

function categorizeFile(relativePath) {
    if (relativePath.includes('chinese/')) return 'chinese';
    if (relativePath.includes('internal/v1/dictionary/')) return 'dictionary-v1';
    if (relativePath.includes('composers/')) return 'composers';
    if (relativePath.includes('grammar/')) return 'grammar';
    if (relativePath.startsWith('dictionary')) return 'dictionary-legacy';
    if (relativePath.includes('internal/cache/')) return 'cache';
    return 'other';
}

function analyzeByCategory(jsonFiles) {
    console.log('\n📋 ANÁLISIS POR CATEGORÍA');
    console.log('=========================');
    
    const categories = {};
    let totalSize = 0;
    
    for (const file of jsonFiles) {
        if (!categories[file.category]) {
            categories[file.category] = { files: [], totalSize: 0 };
        }
        categories[file.category].files.push(file);
        categories[file.category].totalSize += file.size;
        totalSize += file.size;
    }
    
    // Ordenar categorías por tamaño
    const sortedCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b.totalSize - a.totalSize);
    
    console.log(`📁 Total: ${jsonFiles.length} archivos, ${Math.round(totalSize)} KB\n`);
    
    for (const [category, data] of sortedCategories) {
        const percentage = Math.round((data.totalSize / totalSize) * 100);
        console.log(`📂 ${category.toUpperCase()}: ${data.files.length} archivos, ${Math.round(data.totalSize)} KB (${percentage}%)`);
        
        // Mostrar archivos más grandes de cada categoría
        const topFiles = data.files
            .sort((a, b) => b.size - a.size)
            .slice(0, 3);
            
        for (const file of topFiles) {
            console.log(`   • ${file.path} (${file.size} KB)`);
        }
        console.log();
    }
    
    return categories;
}

function identifyRedundancy(categories) {
    console.log('🔍 IDENTIFICANDO REDUNDANCIA');
    console.log('============================');
    
    const redundancies = [];
    
    // 1. Dictionary legacy vs v1
    if (categories['dictionary-legacy'] && categories['dictionary-v1']) {
        redundancies.push({
            type: 'LEGACY_VS_V1',
            description: 'Diccionarios legacy duplican funcionalidad de v1',
            obsolete: categories['dictionary-legacy'].files,
            keep: categories['dictionary-v1'].files,
            savings: categories['dictionary-legacy'].totalSize
        });
    }
    
    // 2. Index files redundantes
    const indexFiles = [];
    for (const [category, data] of Object.entries(categories)) {
        for (const file of data.files) {
            if (file.path.includes('index.json') || file.path.includes('-index.json')) {
                indexFiles.push(file);
            }
        }
    }
    
    if (indexFiles.length > 3) {
        redundancies.push({
            type: 'EXCESSIVE_INDEXES',
            description: 'Demasiados archivos de índice',
            files: indexFiles,
            savings: indexFiles.reduce((sum, f) => sum + f.size, 0)
        });
    }
    
    // 3. Composers con nombres extraños
    if (categories['composers']) {
        const weirdComposers = categories['composers'].files.filter(f => 
            f.path.includes('---') || f.path.includes('--') || f.path.includes('conceptos-te-ricos')
        );
        
        if (weirdComposers.length > 0) {
            redundancies.push({
                type: 'WEIRD_COMPOSER_FILES',
                description: 'Archivos de compositores con nombres problemáticos',
                files: weirdComposers,
                savings: weirdComposers.reduce((sum, f) => sum + f.size, 0)
            });
        }
    }
    
    // 4. Chunks vs archivos completos
    const chunkFiles = [];
    const fullFiles = [];
    
    for (const [category, data] of Object.entries(categories)) {
        for (const file of data.files) {
            if (file.path.includes('chunks/')) {
                chunkFiles.push(file);
            } else if (file.path.includes('languages/') && !file.path.includes('index')) {
                fullFiles.push(file);
            }
        }
    }
    
    if (chunkFiles.length > 0 && fullFiles.length > 0) {
        redundancies.push({
            type: 'CHUNKS_VS_FULL',
            description: 'Archivos completos + chunks duplican datos',
            note: 'Para 13 lecciones, chunks pueden ser innecesarios',
            files: chunkFiles,
            savings: chunkFiles.reduce((sum, f) => sum + f.size, 0)
        });
    }
    
    return redundancies;
}

function proposeSimplifiedSystem(categories, redundancies) {
    console.log('\n🎯 SISTEMA SIMPLIFICADO PROPUESTO');
    console.log('=================================');
    
    const currentTotal = Object.values(categories)
        .reduce((sum, cat) => sum + cat.totalSize, 0);
    
    const potentialSavings = redundancies
        .reduce((sum, red) => sum + red.savings, 0);
    
    console.log(`📊 Estado actual: ${Object.values(categories).reduce((sum, cat) => sum + cat.files.length, 0)} archivos, ${Math.round(currentTotal)} KB`);
    console.log(`💰 Ahorro potencial: ${Math.round(potentialSavings)} KB (${Math.round((potentialSavings/currentTotal)*100)}%)\n`);
    
    console.log('📋 ARCHIVOS ESENCIALES RECOMENDADOS:');
    console.log('=====================================');
    
    const essentialFiles = [
        // Chinese data (solo archivos unificados)
        'chinese/radicals-unified.json',
        'chinese/character-radical-unified.json', 
        'chinese/cache-info.json',
        'chinese/strokes-metadata.json',
        
        // Dictionary v1 (arquitetura moderna)
        'internal/v1/dictionary/languages/es.json',
        'internal/v1/dictionary/languages/en.json', 
        'internal/v1/dictionary/languages/de.json',
        'internal/v1/dictionary/languages/pt.json',
        'internal/v1/dictionary/languages/ru.json',
        'internal/v1/dictionary/languages/ru-rom.json',
        'internal/v1/dictionary/languages/zh.json',
        'internal/v1/dictionary/languages/zh-pinyin.json',
        'internal/v1/dictionary/meta.json',
        'internal/v1/manifest.json',
        
        // Composers (solo los bien nombrados)
        'composers/index.json',
        
        // Grammar (si realmente se usa)
        'grammar/index.json'
    ];
    
    let essentialCount = 0;
    let essentialSize = 0;
    
    for (const essential of essentialFiles) {
        console.log(`   ✅ ${essential}`);
        essentialCount++;
        
        // Calcular tamaño si existe
        const found = Object.values(categories)
            .flat()
            .find(cat => cat.files.find(f => f.path === essential));
        if (found) {
            const file = found.files.find(f => f.path === essential);
            if (file) essentialSize += file.size;
        }
    }
    
    console.log(`\n📈 Sistema simplificado:`);
    console.log(`   📁 Archivos: ${essentialCount} (vs ${Object.values(categories).reduce((sum, cat) => sum + cat.files.length, 0)} actual)`);
    console.log(`   💾 Tamaño: ~${Math.round(essentialSize)} KB (vs ${Math.round(currentTotal)} KB actual)`);
    console.log(`   🎯 Reducción: ${Math.round((1 - essentialCount/Object.values(categories).reduce((sum, cat) => sum + cat.files.length, 0))*100)}% archivos`);
    
    return {
        essential: essentialFiles,
        currentCount: Object.values(categories).reduce((sum, cat) => sum + cat.files.length, 0),
        essentialCount,
        savings: potentialSavings
    };
}

function generateCleanupPlan(redundancies) {
    console.log('\n🧹 PLAN DE LIMPIEZA');
    console.log('===================');
    
    for (const redundancy of redundancies) {
        console.log(`\n❌ ${redundancy.type}: ${redundancy.description}`);
        console.log(`   💰 Ahorro: ${Math.round(redundancy.savings)} KB`);
        
        if (redundancy.files) {
            console.log('   🗑️ Archivos a eliminar:');
            for (const file of redundancy.files) {
                console.log(`      • ${file.path}`);
            }
        }
        
        if (redundancy.obsolete) {
            console.log('   🗑️ Archivos obsoletos:');
            for (const file of redundancy.obsolete) {
                console.log(`      • ${file.path}`);
            }
        }
        
        if (redundancy.note) {
            console.log(`   📝 Nota: ${redundancy.note}`);
        }
    }
}

async function main() {
    try {
        const jsonFiles = findAllJsonFiles();
        const categories = analyzeByCategory(jsonFiles);
        const redundancies = identifyRedundancy(categories);
        const simplifiedSystem = proposeSimplifiedSystem(categories, redundancies);
        generateCleanupPlan(redundancies);
        
        console.log('\n🎉 ANÁLISIS COMPLETADO');
        console.log('======================');
        console.log('Sistema JSON analizado para optimización.');
        
    } catch (error) {
        console.error('💥 Error durante el análisis:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as analyzeJsonRedundancy };