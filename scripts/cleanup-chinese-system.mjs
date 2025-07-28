#!/usr/bin/env node

/**
 * LIMPIEZA SISTEMA CHINO SIMPLIFICADO
 * ===================================
 * 
 * Elimina archivos obsoletos y scripts redundantes para minimizar errores.
 * Mantiene solo los archivos unificados necesarios.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const CHINESE_DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'chinese');

console.log('🧹 LIMPIEZA SISTEMA CHINO SIMPLIFICADO');
console.log('======================================');

// Archivos a mantener (esenciales)
const KEEP_FILES = new Set([
    'radicals-unified.json',           // ✅ Archivo principal de radicales
    'character-radical-unified.json',  // ✅ Archivo principal de caracteres  
    'cedict_raw.txt',                 // ✅ Fuente de datos externa
    'kangxi-radicals-official.json',  // ✅ Referencia estándar Kangxi
    'cache-info.json',                // ✅ Metadatos de cache
    'strokes-metadata.json',          // ✅ Metadatos de trazos
    'strokes'                         // ✅ Directorio de trazos (mantener)
]);

// Archivos obsoletos a eliminar
const OBSOLETE_FILES = [
    'radicals.json',                  // ❌ Reemplazado por radicals-unified.json
    'radicals-consolidated.json',     // ❌ Reemplazado por radicals-unified.json
    'character-radical-map.json',     // ❌ Reemplazado por character-radical-unified.json
    'character-data.json',            // ❌ Datos incluidos en unified
    'radical-lookup.json',            // ❌ Lógica incluida en unified
    'radical-index.json'              // ❌ Índice redundante
];

function cleanupObsoleteFiles() {
    console.log('\n📂 Eliminando archivos obsoletos...');
    
    let removed = 0;
    for (const file of OBSOLETE_FILES) {
        const filePath = path.join(CHINESE_DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`   ❌ Eliminado: ${file}`);
            removed++;
        }
    }
    
    console.log(`✅ ${removed} archivos obsoletos eliminados`);
}

function cleanupBackupDirs() {
    console.log('\n📦 Limpiando directorios de backup antiguos...');
    
    if (!fs.existsSync(CHINESE_DATA_DIR)) return;
    
    const entries = fs.readdirSync(CHINESE_DATA_DIR);
    let removed = 0;
    
    for (const entry of entries) {
        if (entry.startsWith('backup-') && entry.match(/backup-\d+/)) {
            const backupPath = path.join(CHINESE_DATA_DIR, entry);
            if (fs.statSync(backupPath).isDirectory()) {
                fs.rmSync(backupPath, { recursive: true, force: true });
                console.log(`   🗑️ Eliminado backup: ${entry}`);
                removed++;
            }
        }
    }
    
    console.log(`✅ ${removed} directorios de backup eliminados`);
}

function validateEssentialFiles() {
    console.log('\n✅ Verificando archivos esenciales...');
    
    const essentialFiles = [
        'radicals-unified.json',
        'character-radical-unified.json'
    ];
    
    let allPresent = true;
    for (const file of essentialFiles) {
        const filePath = path.join(CHINESE_DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath);
            console.log(`   ✅ ${file} (${Math.round(stat.size / 1024)} KB)`);
        } else {
            console.log(`   ❌ FALTA: ${file}`);
            allPresent = false;
        }
    }
    
    return allPresent;
}

function generateStatusReport() {
    console.log('\n📊 REPORTE FINAL DEL SISTEMA');
    console.log('============================');
    
    if (!fs.existsSync(CHINESE_DATA_DIR)) {
        console.log('❌ Directorio de datos chinos no existe');
        return;
    }
    
    const entries = fs.readdirSync(CHINESE_DATA_DIR);
    const files = entries.filter(e => {
        const stat = fs.statSync(path.join(CHINESE_DATA_DIR, e));
        return stat.isFile();
    });
    
    console.log(`📁 Archivos totales: ${files.length}`);
    console.log('📋 Archivos activos:');
    
    files.forEach(file => {
        const filePath = path.join(CHINESE_DATA_DIR, file);
        const stat = fs.statSync(filePath);
        const sizeKB = Math.round(stat.size / 1024);
        const status = KEEP_FILES.has(file) ? '✅' : '⚠️';
        console.log(`   ${status} ${file} (${sizeKB} KB)`);
    });
    
    console.log('\n🎯 Sistema simplificado:');
    console.log('   • 1 script principal: integrate-chinese-data.mjs');
    console.log('   • 2 archivos de datos: radicals-unified.json + character-radical-unified.json');
    console.log('   • 0 archivos redundantes');
    console.log('   • Mantenimiento automático via npm run integrate-chinese');
}

async function main() {
    try {
        cleanupObsoleteFiles();
        cleanupBackupDirs();
        
        const allEssential = validateEssentialFiles();
        if (!allEssential) {
            console.log('\n⚠️ Archivos esenciales faltantes. Ejecutando integración...');
            // Si falta algo esencial, ejecutar integración
            const { integrateChineseData } = await import('./integrate-chinese-data.mjs');
            await integrateChineseData();
        }
        
        generateStatusReport();
        
        console.log('\n🎉 LIMPIEZA COMPLETADA');
        console.log('=====================');
        console.log('Sistema chino simplificado y optimizado para mínimos errores.');
        
    } catch (error) {
        console.error('💥 Error durante la limpieza:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as cleanupChineseSystem };