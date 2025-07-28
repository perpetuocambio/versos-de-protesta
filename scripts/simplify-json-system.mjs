#!/usr/bin/env node

/**
 * SIMPLIFICACIÓN SISTEMA JSON
 * ============================
 * 
 * Elimina archivos JSON redundantes manteniendo solo los esenciales
 * para un sistema simple pero completo.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');

console.log('🧹 SIMPLIFICACIÓN SISTEMA JSON');
console.log('===============================');

// Archivos que DEBEN mantenerse (sistema esencial)
const ESSENTIAL_FILES = [
    // Chinese data unificados
    'chinese/radicals-unified.json',
    'chinese/character-radical-unified.json', 
    'chinese/cache-info.json',
    'chinese/strokes-metadata.json',
    
    // Dictionary v1 - Solo archivos de idiomas (SIN chunks)
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
    
    // Composers - Solo index (eliminar archivos individuales problemáticos)
    'composers/index.json',
    
    // Grammar - Solo index
    'grammar/index.json'
];

// Archivos específicos a eliminar (obsoletos/redundantes)
const FILES_TO_REMOVE = [
    // Dictionary legacy - REDUNDANTE con v1
    'dictionary.json',
    'dictionary-index.json', 
    'dictionary-light.json',
    'dictionary-stats.json',
    
    // Chunks - REDUNDANTE para 13 lecciones
    'internal/v1/dictionary/chunks/zh-lessons-0-12.json',
    'internal/v1/dictionary/chunks/ru-rom-lessons-0-12.json',
    'internal/v1/dictionary/chunks/ru-lessons-0-12.json',
    'internal/v1/dictionary/chunks/zh-pinyin-lessons-0-12.json',
    'internal/v1/dictionary/chunks/de-lessons-0-12.json',
    'internal/v1/dictionary/chunks/en-lessons-0-12.json',
    'internal/v1/dictionary/chunks/es-lessons-0-12.json',
    'internal/v1/dictionary/chunks/pt-lessons-0-12.json',
    'internal/v1/dictionary/chunks-manifest.json',
    
    // Index files redundantes
    'internal/v1/dictionary/languages/de-index.json',
    'internal/v1/dictionary/languages/en-index.json',
    'internal/v1/dictionary/languages/es-index.json', 
    'internal/v1/dictionary/languages/pt-index.json',
    'internal/v1/dictionary/languages/ru-index.json',
    'internal/v1/dictionary/languages/ru-rom-index.json',
    'internal/v1/dictionary/languages/zh-index.json',
    'internal/v1/dictionary/languages/zh-pinyin-index.json',
    'internal/v1/dictionary/index.json',
    
    // Chinese obsoletos
    'chinese/character-data.json',  // Datos incluidos en unified
    
    // Composers con nombres problemáticos
    'composers/-------------------.json',
    'composers/canci-n-popular-de-shaanxi--adaptaci-n-revolucionaria-.json',
    'composers/canci-n-tradicional-del-bund---interpretada-por-daniel-kahn---psoy-korolenko.json',
    'composers/conceptos-te-ricos.json',
    'composers/eug-ne-pottier---pierre-de-geyter.json',
    'composers/himno-anarquista---adaptaci-n-de-emilio-arrieta.json',
    'composers/alexandr-alexandrov.json',
    'composers/ernst-busch.json',
    'composers/hanns-eisler.json',
    'composers/paola-nicolazzi.json',
    'composers/quilapay-n.json',
    'composers/sergio-ortega.json',
    'composers/valeriano-orob-n-fern-ndez.json',
    
    // Grammar archivos individuales (mantener solo index)
    'grammar/syntax-patterns.json',
    'grammar/case-systems.json',
    
    // Cache interno
    'internal/cache/popular-words.json'
];

function createBackup() {
    console.log('\n💾 Creando backup del sistema actual...');
    
    const timestamp = Date.now();
    const backupDir = path.join(DATA_DIR, `backup-json-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup completo
    const backupScript = `cp -r "${DATA_DIR}"/* "${backupDir}/" 2>/dev/null || true`;
    try {
        require('child_process').execSync(backupScript);
        console.log(`✅ Backup creado en: backup-json-${timestamp}/`);
        return backupDir;
    } catch (error) {
        console.log(`⚠️ Backup manual recomendado: ${error.message}`);
        return null;
    }
}

function removeObsoleteFiles() {
    console.log('\n🗑️ Eliminando archivos obsoletos...');
    
    let removedCount = 0;
    let savedSpace = 0;
    
    for (const fileRelative of FILES_TO_REMOVE) {
        const filePath = path.join(DATA_DIR, fileRelative);
        
        if (fs.existsSync(filePath)) {
            try {
                const stat = fs.statSync(filePath);
                savedSpace += stat.size;
                
                fs.unlinkSync(filePath);
                console.log(`   ❌ Eliminado: ${fileRelative} (${Math.round(stat.size/1024)} KB)`);
                removedCount++;
            } catch (error) {
                console.log(`   ⚠️ Error eliminando ${fileRelative}: ${error.message}`);
            }
        } else {
            console.log(`   ✅ Ya limpio: ${fileRelative}`);
        }
    }
    
    console.log(`\n📊 Archivos eliminados: ${removedCount}`);
    console.log(`💾 Espacio liberado: ${Math.round(savedSpace/1024)} KB`);
    
    return { removedCount, savedSpace };
}

function removeEmptyDirectories() {
    console.log('\n📁 Eliminando directorios vacíos...');
    
    const dirsToCheck = [
        'internal/v1/dictionary/chunks',
        'internal/cache',
        'composers',
        'grammar'
    ];
    
    let removedDirs = 0;
    
    for (const dirRelative of dirsToCheck) {
        const dirPath = path.join(DATA_DIR, dirRelative);
        
        if (fs.existsSync(dirPath)) {
            try {
                const entries = fs.readdirSync(dirPath);
                if (entries.length === 0) {
                    fs.rmdirSync(dirPath);
                    console.log(`   🗑️ Directorio vacío eliminado: ${dirRelative}`);
                    removedDirs++;
                } else {
                    console.log(`   📁 Mantenido (contiene archivos): ${dirRelative}`);
                }
            } catch (error) {
                console.log(`   ⚠️ Error revisando ${dirRelative}: ${error.message}`);
            }
        }
    }
    
    return removedDirs;
}

function validateEssentialFiles() {
    console.log('\n✅ Verificando archivos esenciales...');
    
    let allPresent = true;
    let totalSize = 0;
    
    for (const fileRelative of ESSENTIAL_FILES) {
        const filePath = path.join(DATA_DIR, fileRelative);
        
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            totalSize += stat.size;
            console.log(`   ✅ ${fileRelative} (${Math.round(stat.size/1024)} KB)`);
        } else {
            console.log(`   ❌ FALTA: ${fileRelative}`);
            allPresent = false;
        }
    }
    
    console.log(`\n📊 Archivos esenciales: ${ESSENTIAL_FILES.length}`);
    console.log(`💾 Tamaño total: ${Math.round(totalSize/1024)} KB`);
    
    return { allPresent, totalSize, count: ESSENTIAL_FILES.length };
}

function generateFinalReport(removed, validated) {
    console.log('\n📋 REPORTE FINAL DE SIMPLIFICACIÓN');
    console.log('==================================');
    
    console.log('📊 ANTES vs DESPUÉS:');
    console.log(`   • Archivos eliminados: ${removed.removedCount}`);
    console.log(`   • Archivos esenciales: ${validated.count}`);
    console.log(`   • Espacio liberado: ${Math.round(removed.savedSpace/1024)} KB`);
    console.log(`   • Tamaño final: ${Math.round(validated.totalSize/1024)} KB`);
    
    const reductionPercent = Math.round((removed.savedSpace / (removed.savedSpace + validated.totalSize)) * 100);
    console.log(`   • Reducción: ${reductionPercent}%`);
    
    console.log('\n🎯 SISTEMA SIMPLIFICADO:');
    console.log('   ✅ Solo archivos esenciales mantenidos');
    console.log('   ✅ Sin redundancia entre legacy y v1');
    console.log('   ✅ Sin chunks innecesarios para 13 lecciones'); 
    console.log('   ✅ Sin archivos de compositores problemáticos');
    console.log('   ✅ Estructura limpia y predecible');
    
    if (validated.allPresent) {
        console.log('\n🎉 SIMPLIFICACIÓN COMPLETADA CON ÉXITO');
        console.log('Sistema JSON optimizado: simple pero completo');
    } else {
        console.log('\n⚠️ SIMPLIFICACIÓN PARCIAL');
        console.log('Algunos archivos esenciales faltan - regenerar con npm run update-all');
    }
}

async function main() {
    try {
        console.log('🎯 Objetivo: Reducir de 56 archivos a ~16 archivos esenciales\n');
        
        // 1. Backup de seguridad
        const backupDir = createBackup();
        
        // 2. Eliminar archivos obsoletos
        const removed = removeObsoleteFiles();
        
        // 3. Limpiar directorios vacíos  
        const removedDirs = removeEmptyDirectories();
        
        // 4. Validar archivos esenciales
        const validated = validateEssentialFiles();
        
        // 5. Reporte final
        generateFinalReport(removed, validated);
        
        if (backupDir) {
            console.log(`\n💾 Backup disponible en: ${path.basename(backupDir)}`);
            console.log('   Para restaurar: cp -r backup-json-*/\\* ./');
        }
        
    } catch (error) {
        console.error('💥 Error durante la simplificación:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as simplifyJsonSystem };