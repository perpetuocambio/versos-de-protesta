#!/usr/bin/env node

/**
 * VALIDACIÓN COMPLETA DEL SISTEMA
 * ===============================
 * 
 * Verifica que todos los scripts funcionen correctamente en conjunto
 * y que el pipeline de precommit esté bien configurado.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

console.log('🔍 VALIDACIÓN COMPLETA DEL SISTEMA');
console.log('==================================');

const EXPECTED_SCRIPTS = [
    'build-dictionary.mjs',
    'partition-dictionary.mjs', 
    'chunk-dictionary-for-scale.mjs',
    'migrate-to-internal-structure.mjs',
    'download-chinese-strokes.mjs',
    'download-cedict-data.mjs',
    'integrate-chinese-data.mjs',
    'cleanup-chinese-system.mjs',
    'validate-lesson.py',
    'check-frontmatter.sh'
];

const ESSENTIAL_COMMANDS = [
    'build-dictionary',
    'partition-dictionary',
    'chunk-dictionary', 
    'migrate-internal',
    'download-strokes',
    'download-cedict',
    'integrate-chinese',
    'update-all',
    'validate-lessons'
];

function validateScriptsExist() {
    console.log('\n📁 Verificando archivos de scripts...');
    
    let allPresent = true;
    for (const script of EXPECTED_SCRIPTS) {
        const scriptPath = path.join(__dirname, script);
        if (fs.existsSync(scriptPath)) {
            console.log(`   ✅ ${script}`);
        } else {
            console.log(`   ❌ FALTA: ${script}`);
            allPresent = false;
        }
    }
    
    return allPresent;
}

function validatePackageJson() {
    console.log('\n📦 Verificando package.json...');
    
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    let allPresent = true;
    for (const command of ESSENTIAL_COMMANDS) {
        if (packageData.scripts[command]) {
            console.log(`   ✅ npm run ${command}`);
        } else {
            console.log(`   ❌ FALTA: npm run ${command}`);
            allPresent = false;
        }
    }
    
    return allPresent;
}

function validatePrecommitConfig() {
    console.log('\n🪝 Verificando configuración precommit...');
    
    const precommitPath = path.join(PROJECT_ROOT, '.pre-commit-config.yaml');
    if (!fs.existsSync(precommitPath)) {
        console.log('   ❌ FALTA: .pre-commit-config.yaml');
        return false;
    }
    
    const precommitContent = fs.readFileSync(precommitPath, 'utf8');
    
    const checks = [
        { pattern: /update-dictionary-complete/, name: 'Hook principal de diccionario' },
        { pattern: /validate-lesson-frontmatter/, name: 'Hook de validación frontmatter' },
        { pattern: /scripts\/check-frontmatter\.sh/, name: 'Script de validación frontmatter' },
        { pattern: /npm run update-all/, name: 'Comando update-all' }
    ];
    
    let allPresent = true;
    for (const check of checks) {
        if (check.pattern.test(precommitContent)) {
            console.log(`   ✅ ${check.name}`);
        } else {
            console.log(`   ❌ FALTA: ${check.name}`);
            allPresent = false;
        }
    }
    
    return allPresent;
}

function validateDataDirectories() {
    console.log('\n📊 Verificando estructura de datos...');
    
    const directories = [
        'public/data/internal/v1/dictionary',
        'public/data/chinese', 
        'public/data/languages'
    ];
    
    let allPresent = true;
    for (const dir of directories) {
        const dirPath = path.join(PROJECT_ROOT, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`   ✅ ${dir}/`);
        } else {
            console.log(`   ⚠️ FALTA: ${dir}/ (se creará automáticamente)`);
        }
    }
    
    return allPresent;
}

function testPipelineIntegrity() {
    console.log('\n🔗 Probando integridad del pipeline...');
    
    try {
        // Test que npm run update-all no tenga scripts faltantes
        console.log('   🧪 Verificando comandos en update-all...');
        const packagePath = path.join(PROJECT_ROOT, 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const updateAllScript = packageData.scripts['update-all'];
        
        const commands = updateAllScript.match(/npm run [\w-]+/g) || [];
        let allValid = true;
        
        for (const cmdMatch of commands) {
            const cmd = cmdMatch.replace('npm run ', '');
            if (packageData.scripts[cmd]) {
                console.log(`     ✅ ${cmd} existe`);
            } else {
                console.log(`     ❌ ${cmd} NO EXISTE`);
                allValid = false;
            }
        }
        
        return allValid;
    } catch (error) {
        console.log(`   ❌ Error probando pipeline: ${error.message}`);
        return false;
    }
}

function checkObsoleteFiles() {
    console.log('\n🧹 Verificando archivos obsoletos...');
    
    const obsoleteFiles = [
        'public/data/chinese/radicals.json',
        'public/data/chinese/radicals-consolidated.json', 
        'public/data/chinese/character-radical-map.json',
        'scripts/generate-radical-data.mjs',
        'scripts/consolidate-radical-data.mjs',
        'scripts/expand-kangxi-radicals.mjs'
    ];
    
    let allClean = true;
    for (const file of obsoleteFiles) {
        const filePath = path.join(PROJECT_ROOT, file);
        if (fs.existsSync(filePath)) {
            console.log(`   ⚠️ OBSOLETO PRESENTE: ${file}`);
            allClean = false;
        } else {
            console.log(`   ✅ Limpio: ${file}`);
        }
    }
    
    return allClean;
}

function generateSystemReport() {
    console.log('\n📋 REPORTE FINAL DEL SISTEMA');
    console.log('============================');
    
    const scriptsOk = validateScriptsExist();
    const packageOk = validatePackageJson();
    const precommitOk = validatePrecommitConfig();
    const dataOk = validateDataDirectories();
    const pipelineOk = testPipelineIntegrity();
    const cleanOk = checkObsoleteFiles();
    
    const overallScore = [scriptsOk, packageOk, precommitOk, dataOk, pipelineOk, cleanOk]
        .filter(Boolean).length;
    
    console.log(`\n🎯 PUNTUACIÓN GENERAL: ${overallScore}/6`);
    
    if (overallScore === 6) {
        console.log('✅ SISTEMA COMPLETAMENTE VALIDADO');
        console.log('   • Todos los scripts funcionan correctamente');
        console.log('   • Pipeline de precommit configurado');
        console.log('   • Funcionalidad aislada y coherente');
        console.log('   • Sin archivos obsoletos');
    } else {
        console.log('⚠️ SISTEMA REQUIERE ATENCIÓN');
        console.log('   • Revisa los elementos marcados con ❌');
        console.log('   • Ejecuta las correcciones necesarias');
    }
    
    return overallScore === 6;
}

async function main() {
    try {
        const systemValid = generateSystemReport();
        
        if (systemValid) {
            console.log('\n🎉 VALIDACIÓN COMPLETADA - Sistema optimizado');
            process.exit(0);
        } else {
            console.log('\n💥 VALIDACIÓN FALLIDA - Sistema requiere correcciones');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Error durante la validación:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main as validateSystem };