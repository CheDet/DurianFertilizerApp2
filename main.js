// main.js - CORRECTED VERSION

import { supabase } from './supabaseClient.js';

// --- Global State ---
let masterFertilizers = [];
let userCalculations = []; // This was the missing piece for global state
let currentLang = localStorage.getItem('fertilizerAppLang') || 'zh';

// --- Language Strings ---
const langStrings = {
    zh: {
        pageTitle: "肥料计算器",
        appTitle: "肥料计算器",
        adminPanelBtn: "管理面板",
        masterListTitle: "可用肥料 (主列表)",
        loadingMaster: "正在加载主列表...",
        savedCalcsTitle: "我保存的计算",
        loadingSaved: "正在加载已保存的计算...",
        adminModalTitle: "添加新肥料到主列表",
        brandLabel: "品牌名称",
        weightLabel: "包装重量 (公斤)",
        priceLabel: "每包价格 (RM)",
        nutrientTitle: "营养成分 (%)",
        saveToMasterBtn: "保存到主列表",
        newCalcTitle: "新计算",
        editCalcTitle: "编辑计算",
        calcNameLabel: "计算名称 (例如, 'A区 - 幼树')",
        treesLabel: "树木数量",
        rateLabel: "施肥量 (公斤/棵)",
        freqLabel: "年施肥次数",
        saveCalcBtn: "保存计算",
        brandHeader: "品牌",
        weightHeader: "包装重量 (公斤)",
        priceHeader: "每包价格 (RM)",
        nutrientsHeader: "营养素",
        actionHeader: "操作",
        calculateBtn: "计算",
        noMasterFertilizers: "主列表中没有肥料。请通过管理面板添加。",
        noSavedCalcs: "您没有已保存的计算。",
        inputsTitle: "您的输入",
        resultsTitle: "计算结果",
        totalAnnualCost: "年度总成本",
        annualCostPerTree: "年度单棵树成本",
        pricePerKg: "每公斤价格",
        packetsAnnually: "年需购买包数",
        totalNeed: "年度总需量",
        pricePerKgNutrient: "每公斤营养素价格",
        editBtn: "编辑",
        deleteBtn: "删除",
        confirmDelete: "您确定要删除此计算吗？",
        errorSaving: "保存时出错：",
        successSaving: "已成功保存！",
        errorDeleting: "删除时出错：",
        langSwitchTo: "English",
    },
    en: {
        pageTitle: "Fertilizer Calculator",
        appTitle: "Fertilizer Calculator",
        adminPanelBtn: "Admin Panel",
        masterListTitle: "Available Fertilizers (Master List)",
        loadingMaster: "Loading master list...",
        savedCalcsTitle: "My Saved Calculations",
        loadingSaved: "Loading saved calculations...",
        adminModalTitle: "Add New Fertilizer to Master List",
        brandLabel: "Brand Name",
        weightLabel: "Packet Weight (kg)",
        priceLabel: "Price per Packet (RM)",
        nutrientTitle: "Nutrient Content (%)",
        saveToMasterBtn: "Save to Master List",
        newCalcTitle: "New Calculation",
        editCalcTitle: "Editing",
        calcNameLabel: "Calculation Name (e.g., 'Block A - Young Trees')",
        treesLabel: "Number of Trees",
        rateLabel: "Fertilizer Rate (kg/tree)",
        freqLabel: "Applications per Year",
        saveCalcBtn: "Save Calculation",
        brandHeader: "Brand",
        weightHeader: "Packet Weight (kg)",
        priceHeader: "Price/Packet (RM)",
        nutrientsHeader: "Nutrients",
        actionHeader: "Action",
        calculateBtn: "Calculate",
        noMasterFertilizers: "No fertilizers found in the master list. Please add some via the Admin Panel.",
        noSavedCalcs: "You have no saved calculations.",
        inputsTitle: "Your Inputs",
        resultsTitle: "Calculated Results",
        totalAnnualCost: "Total Annual Cost",
        annualCostPerTree: "Annual Cost/Tree",
        pricePerKg: "Price/kg",
        packetsAnnually: "Packets/Year",
        totalNeed: "Total Need/Year",
        pricePerKgNutrient: "Price/kg Nutrients",
        editBtn: "Edit",
        deleteBtn: "Delete",
        confirmDelete: "Are you sure you want to delete this calculation?",
        errorSaving: "Error saving: ",
        successSaving: "Successfully saved!",
        errorDeleting: "Error deleting: ",
        langSwitchTo: "中文",
    }
};

// --- DOM Elements ---
const masterListContainer = document.getElementById('master-list-container');
const savedCalculationsList = document.getElementById('saved-calculations-list');
const adminModal = document.getElementById('admin-modal');
const calculationModal = document.getElementById('calculation-modal');
const adminForm = document.getElementById('admin-form');
const calculationForm = document.getElementById('calculation-form');
const calcModalTitle = document.getElementById('calculation-modal-title');
const adminPanelBtn = document.getElementById('admin-panel-btn');
const langSwitcherBtn = document.getElementById('lang-switcher');
const closeButtons = document.querySelectorAll('.close-btn');

const PREDEFINED_NUTRIENTS = ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Calcium (Ca)', 'Magnesium (Mg)', 'Sulfur (S)', 'Iron (Fe)', 'Manganese (Mn)', 'Zinc (Zn)', 'Copper (Cu)', 'Boron (B)', 'Molybdenum (Mo)'];

// --- LANGUAGE & RENDERING ---
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('fertilizerAppLang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        if (langStrings[lang][key]) {
            el.textContent = langStrings[lang][key];
        }
    });

    langSwitcherBtn.textContent = langStrings[lang].langSwitchTo;
    
    // Re-render all dynamic content with the new language
    renderMasterFertilizerTable();
    renderUserCalculations();
}

// --- SUPABASE FUNCTIONS ---
async function fetchMasterFertilizers() {
    const { data, error } = await supabase.from('fertilizers_master').select('*').order('brand');
    if (error) {
        console.error('Error fetching master fertilizers:', error);
        masterListContainer.innerHTML = `<p>${langStrings[currentLang].errorLoading}</p>`;
        return;
    }
    masterFertilizers = data; // Store in global state
}

async function fetchUserCalculations() {
    const { data, error } = await supabase.from('user_calculations').select('*, fertilizers_master(brand)').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching user calculations:', error);
        savedCalculationsList.innerHTML = `<p>${langStrings[currentLang].errorLoading}</p>`;
        return;
    }
    userCalculations = data; // Store in global state
}

function renderMasterFertilizerTable() {
    const s = langStrings[currentLang];
    if (masterFertilizers.length === 0) {
        masterListContainer.innerHTML = `<p>${s.noMasterFertilizers}</p>`;
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>${s.brandHeader}</th>
                <th>${s.weightHeader}</th>
                <th>${s.priceHeader}</th>
                <th>${s.nutrientsHeader}</th>
                <th>${s.actionHeader}</th>
            </tr>
        </thead>
        <tbody>
            ${masterFertilizers.map(fert => `
                <tr>
                    <td>${fert.brand}</td>
                    <td>${fert.packet_weight}</td>
                    <td>${fert.packet_price.toFixed(2)}</td>
                    <td>${fert.nutrients ? Object.keys(fert.nutrients).join(', ') : 'N/A'}</td>
                    <td><button class="btn calc-btn" data-id="${fert.id}">${s.calculateBtn}</button></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    masterListContainer.innerHTML = '';
    masterListContainer.appendChild(table);
}

function renderUserCalculations() {
    const s = langStrings[currentLang];
     if (userCalculations.length === 0) {
        savedCalculationsList.innerHTML = `<p>${s.noSavedCalcs}</p>`;
        return;
    }
    
    savedCalculationsList.innerHTML = userCalculations.map(calc => {
        const masterFert = masterFertilizers.find(f => f.id === calc.fertilizer_id);
        if (!masterFert) return ''; 

        const results = calculateCosts(masterFert, calc);

        const inputItems = `
            <div class="detail-item"><strong>${calc.trees}</strong><span>${s.treesLabel}</span></div>
            <div class="detail-item"><strong>${calc.rate} kg</strong><span>${s.rateLabel}</span></div>
            <div class="detail-item"><strong>${calc.frequency}</strong><span>${s.freqLabel}</span></div>
        `;
        const resultItems = `
            <div class="detail-item"><strong>RM ${results.totalAnnualCost}</strong><span>${s.totalAnnualCost}</span></div>
            <div class="detail-item"><strong>RM ${results.annualCostPerTree}</strong><span>${s.annualCostPerTree}</span></div>
            <div class="detail-item"><strong>RM ${results.pricePerKg}</strong><span>${s.pricePerKg}</span></div>
            <div class="detail-item"><strong>${results.packetsAnnually}</strong><span>${s.packetsAnnually}</span></div>
            <div class="detail-item"><strong>${results.totalNeed} kg</strong><span>${s.totalNeed}</span></div>
            <div class="detail-item"><strong>${results.pricePerKgNutrient ? `RM ${results.pricePerKgNutrient}` : 'N/A'}</strong><span>${s.pricePerKgNutrient}</span></div>
        `;

        return `
            <div class="calculation-entry" data-id="${calc.id}">
                <div class="entry-header">
                    <h3>${calc.calculation_name || 'Untitled'} <small style="color: var(--subtle-text); font-weight: 400;">(using ${masterFert.brand})</small></h3>
                    <div class="arrow">&#9662;</div>
                </div>
                <div class="entry-content">
                    <div class="details-section"><h4>${s.inputsTitle}</h4><div class="details-grid">${inputItems}</div></div>
                    <div class="details-section"><h4>${s.resultsTitle}</h4><div class="details-grid">${resultItems}</div></div>
                    <div class="entry-controls">
                        <button class="entry-btn edit-btn" data-calc='${JSON.stringify(calc)}'>${s.editBtn}</button>
                        <button class="entry-btn delete-btn">${s.deleteBtn}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// --- CALCULATION LOGIC (Unchanged) ---
function calculateCosts(masterFertilizer, userInputs) {
    const trees = parseFloat(userInputs.trees);
    const rate = parseFloat(userInputs.rate);
    const frequency = parseFloat(userInputs.frequency);
    const packetWeight = parseFloat(masterFertilizer.packet_weight);
    const packetPrice = parseFloat(masterFertilizer.packet_price);
    
    const totalAnnualNeed = trees * rate * frequency;
    const packetsAnnually = Math.ceil(totalAnnualNeed / packetWeight);
    const totalAnnualCost = packetsAnnually * packetPrice;
    const annualCostPerTree = totalAnnualCost / trees;
    const pricePerKg = packetPrice / packetWeight;

    let pricePerKgNutrient = null;
    if (masterFertilizer.nutrients) {
        const totalNutrientPercent = Object.values(masterFertilizer.nutrients).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        if (totalNutrientPercent > 0) {
            pricePerKgNutrient = pricePerKg / (totalNutrientPercent / 100);
        }
    }

    return {
        totalAnnualCost: totalAnnualCost.toFixed(2),
        annualCostPerTree: annualCostPerTree.toFixed(2),
        pricePerKg: pricePerKg.toFixed(2),
        packetsAnnually,
        totalNeed: totalAnnualNeed.toFixed(2),
        pricePerKgNutrient: pricePerKgNutrient ? pricePerKgNutrient.toFixed(2) : null
    };
}


// --- MODAL & FORM HANDLING ---
function openModal(modal) { modal.style.display = 'flex'; }
function closeModal(modal) { modal.style.display = 'none'; }

function setupAdminNutrientList() {
    const listEl = document.getElementById('admin-nutrient-list');
    listEl.innerHTML = PREDEFINED_NUTRIENTS.map(nutrient => `
        <div class="form-group">
            <label for="nutrient-${nutrient}">${nutrient}</label>
            <input type="number" step="any" id="nutrient-${nutrient}" data-nutrient-name="${nutrient}">
        </div>
    `).join('');
}

adminPanelBtn.addEventListener('click', () => openModal(adminModal));
closeButtons.forEach(btn => btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.modalId))));
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target); });

// --- EVENT HANDLERS ---
langSwitcherBtn.addEventListener('click', () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
});

adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nutrients = {};
    adminForm.querySelectorAll('[data-nutrient-name]').forEach(input => {
        if (input.value && parseFloat(input.value) > 0) {
            nutrients[input.dataset.nutrientName] = parseFloat(input.value);
        }
    });

    const newFertilizer = {
        brand: document.getElementById('brand').value,
        packet_weight: parseFloat(document.getElementById('packetWeight').value),
        packet_price: parseFloat(document.getElementById('packetPrice').value),
        nutrients: nutrients
    };

    const { error } = await supabase.from('fertilizers_master').insert(newFertilizer);
    if (error) {
        alert(langStrings[currentLang].errorSaving + error.message);
    } else {
        alert(langStrings[currentLang].successSaving);
        adminForm.reset();
        closeModal(adminModal);
        await fetchMasterFertilizers(); // Re-fetch and then render
        renderMasterFertilizerTable();
    }
});

calculationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const calculationData = {
        fertilizer_id: parseInt(document.getElementById('master-fertilizer-id').value),
        calculation_name: document.getElementById('calculationName').value,
        trees: parseInt(document.getElementById('trees').value),
        rate: parseFloat(document.getElementById('rate').value),
        frequency: parseInt(document.getElementById('frequency').value)
    };
    
    const calcId = document.getElementById('calculation-id').value;
    const { error } = calcId 
        ? await supabase.from('user_calculations').update(calculationData).eq('id', calcId)
        : await supabase.from('user_calculations').insert(calculationData);

    if (error) {
        alert(langStrings[currentLang].errorSaving + error.message);
    } else {
        calculationForm.reset();
        closeModal(calculationModal);
        await fetchUserCalculations(); // Re-fetch and then render
        renderUserCalculations();
    }
});

// Event Delegation for dynamic buttons
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('calc-btn')) {
        const fertId = e.target.dataset.id;
        const masterFert = masterFertilizers.find(f => f.id == fertId);
        
        calculationForm.reset();
        document.getElementById('master-fertilizer-id').value = fertId;
        document.getElementById('calculation-id').value = '';
        calcModalTitle.textContent = `${langStrings[currentLang].newCalcTitle} (${masterFert.brand})`;
        openModal(calculationModal);
    }

    if (e.target.closest('.entry-header')) {
        e.target.closest('.calculation-entry').classList.toggle('is-open');
    }

    if (e.target.classList.contains('delete-btn')) {
        const entry = e.target.closest('.calculation-entry');
        const calcId = entry.dataset.id;
        if (confirm(langStrings[currentLang].confirmDelete)) {
            const { error } = await supabase.from('user_calculations').delete().eq('id', calcId);
            if (error) {
                alert(langStrings[currentLang].errorDeleting + error.message);
            } else {
                await fetchUserCalculations(); // Re-fetch and then render
                renderUserCalculations();
            }
        }
    }
    
    if (e.target.classList.contains('edit-btn')) {
        const calcData = JSON.parse(e.target.dataset.calc);
        
        document.getElementById('calculation-id').value = calcData.id;
        document.getElementById('master-fertilizer-id').value = calcData.fertilizer_id;
        document.getElementById('calculationName').value = calcData.calculation_name;
        document.getElementById('trees').value = calcData.trees;
        document.getElementById('rate').value = calcData.rate;
        document.getElementById('frequency').value = calcData.frequency;
        
        calcModalTitle.textContent = `${langStrings[currentLang].editCalcTitle}: ${calcData.calculation_name}`;
        openModal(calculationModal);
    }
});

// --- INITIALIZATION ---
async function init() {
    setupAdminNutrientList();
    // 1. Fetch all data first
    await fetchMasterFertilizers();
    await fetchUserCalculations();
    // 2. Now render the entire page in the correct language
    setLanguage(currentLang);
}

init();
