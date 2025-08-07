// main.js

import { supabase } from './supabaseClient.js';

// --- Global State ---
let masterFertilizers = [];

// --- DOM Elements ---
const masterListContainer = document.getElementById('master-list-container');
const savedCalculationsList = document.getElementById('saved-calculations-list');

// Modals & Forms
const adminModal = document.getElementById('admin-modal');
const calculationModal = document.getElementById('calculation-modal');
const adminForm = document.getElementById('admin-form');
const calculationForm = document.getElementById('calculation-form');
const calcModalTitle = document.getElementById('calculation-modal-title');

// Buttons
const adminPanelBtn = document.getElementById('admin-panel-btn');
const closeButtons = document.querySelectorAll('.close-btn');

// --- Pre-defined Nutrients for Admin Form ---
const PREDEFINED_NUTRIENTS = ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Calcium (Ca)', 'Magnesium (Mg)', 'Sulfur (S)', 'Iron (Fe)', 'Manganese (Mn)', 'Zinc (Zn)', 'Copper (Cu)', 'Boron (B)', 'Molybdenum (Mo)'];

// --- SUPABASE FUNCTIONS ---
async function fetchMasterFertilizers() {
    const { data, error } = await supabase.from('fertilizers_master').select('*').order('brand');
    if (error) {
        console.error('Error fetching master fertilizers:', error);
        masterListContainer.innerHTML = '<p>Error loading data.</p>';
        return;
    }
    masterFertilizers = data;
    renderMasterFertilizerTable();
}

async function fetchUserCalculations() {
    const { data, error } = await supabase.from('user_calculations').select('*, fertilizers_master(brand)').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching user calculations:', error);
        savedCalculationsList.innerHTML = '<p>Error loading calculations.</p>';
        return;
    }
    renderUserCalculations(data);
}

// --- RENDERING FUNCTIONS ---
function renderMasterFertilizerTable() {
    if (masterFertilizers.length === 0) {
        masterListContainer.innerHTML = '<p>No fertilizers found in the master list. Please add some via the Admin Panel.</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Brand</th>
                <th>Packet Weight (kg)</th>
                <th>Price/Packet (RM)</th>
                <th>Nutrients</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            ${masterFertilizers.map(fert => `
                <tr>
                    <td>${fert.brand}</td>
                    <td>${fert.packet_weight}</td>
                    <td>${fert.packet_price.toFixed(2)}</td>
                    <td>${fert.nutrients ? Object.keys(fert.nutrients).join(', ') : 'N/A'}</td>
                    <td><button class="btn calc-btn" data-id="${fert.id}">Calculate</button></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    masterListContainer.innerHTML = '';
    masterListContainer.appendChild(table);
}

function renderUserCalculations(calculations) {
     if (calculations.length === 0) {
        savedCalculationsList.innerHTML = '<p>You have no saved calculations.</p>';
        return;
    }
    
    savedCalculationsList.innerHTML = calculations.map(calc => {
        const masterFert = masterFertilizers.find(f => f.id === calc.fertilizer_id);
        if (!masterFert) return ''; // Skip if master fertilizer is deleted

        const results = calculateCosts(masterFert, calc);

        const inputItems = `
            <div class="detail-item"><strong>${calc.trees}</strong><span>Trees</span></div>
            <div class="detail-item"><strong>${calc.rate} kg</strong><span>Rate/Tree</span></div>
            <div class="detail-item"><strong>${calc.frequency}</strong><span>Apps/Year</span></div>
        `;
        const resultItems = `
            <div class="detail-item"><strong>RM ${results.totalAnnualCost}</strong><span>Total Annual Cost</span></div>
            <div class="detail-item"><strong>RM ${results.annualCostPerTree}</strong><span>Annual Cost/Tree</span></div>
            <div class="detail-item"><strong>RM ${results.pricePerKg}</strong><span>Price/kg</span></div>
            <div class="detail-item"><strong>${results.packetsAnnually}</strong><span>Packets/Year</span></div>
            <div class="detail-item"><strong>${results.totalNeed} kg</strong><span>Total Need/Year</span></div>
            <div class="detail-item"><strong>${results.pricePerKgNutrient ? `RM ${results.pricePerKgNutrient}` : 'N/A'}</strong><span>Price/kg Nutrients</span></div>
        `;

        return `
            <div class="calculation-entry" data-id="${calc.id}">
                <div class="entry-header">
                    <h3>${calc.calculation_name || 'Untitled Calculation'} <small style="color: var(--subtle-text); font-weight: 400;">(using ${masterFert.brand})</small></h3>
                    <div class="arrow">&#9662;</div>
                </div>
                <div class="entry-content">
                    <div class="details-section"><h4>Your Inputs</h4><div class="details-grid">${inputItems}</div></div>
                    <div class="details-section"><h4>Calculated Results</h4><div class="details-grid">${resultItems}</div></div>
                    <div class="entry-controls">
                        <button class="entry-btn edit-btn" data-calc='${JSON.stringify(calc)}'>Edit</button>
                        <button class="entry-btn delete-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// --- CALCULATION LOGIC ---
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
function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

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
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// --- EVENT HANDLERS ---
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(adminForm);

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
        alert('Error saving fertilizer: ' + error.message);
    } else {
        alert('Fertilizer saved to master list!');
        adminForm.reset();
        closeModal(adminModal);
        fetchMasterFertilizers(); // Refresh the list
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
    let error;

    if (calcId) { // Update existing
        const { error: updateError } = await supabase.from('user_calculations').update(calculationData).eq('id', calcId);
        error = updateError;
    } else { // Insert new
        const { error: insertError } = await supabase.from('user_calculations').insert(calculationData);
        error = insertError;
    }

    if (error) {
        alert('Error saving calculation: ' + error.message);
    } else {
        calculationForm.reset();
        closeModal(calculationModal);
        fetchUserCalculations(); // Refresh the list
    }
});


// Event Delegation for dynamic buttons
document.addEventListener('click', async (e) => {
    // Handle "Calculate" button on master list
    if (e.target.classList.contains('calc-btn')) {
        const fertId = e.target.dataset.id;
        const masterFert = masterFertilizers.find(f => f.id == fertId);
        
        calculationForm.reset();
        document.getElementById('master-fertilizer-id').value = fertId;
        document.getElementById('calculation-id').value = ''; // Clear edit ID
        calcModalTitle.textContent = `New Calculation with ${masterFert.brand}`;
        openModal(calculationModal);
    }

    // Handle expand/collapse for saved calculations
    if (e.target.closest('.entry-header')) {
        e.target.closest('.calculation-entry').classList.toggle('is-open');
    }

    // Handle "Delete" on saved calculation
    if (e.target.classList.contains('delete-btn')) {
        const entry = e.target.closest('.calculation-entry');
        const calcId = entry.dataset.id;
        if (confirm('Are you sure you want to delete this calculation?')) {
            const { error } = await supabase.from('user_calculations').delete().eq('id', calcId);
            if (error) {
                alert('Error deleting: ' + error.message);
            } else {
                fetchUserCalculations(); // Refresh list
            }
        }
    }
    
    // Handle "Edit" on saved calculation
    if (e.target.classList.contains('edit-btn')) {
        const calcData = JSON.parse(e.target.dataset.calc);
        const masterFert = masterFertilizers.find(f => f.id === calcData.fertilizer_id);
        
        document.getElementById('calculation-id').value = calcData.id;
        document.getElementById('master-fertilizer-id').value = calcData.fertilizer_id;
        document.getElementById('calculationName').value = calcData.calculation_name;
        document.getElementById('trees').value = calcData.trees;
        document.getElementById('rate').value = calcData.rate;
        document.getElementById('frequency').value = calcData.frequency;
        
        calcModalTitle.textContent = `Editing: ${calcData.calculation_name}`;
        openModal(calculationModal);
    }
});

// --- INITIALIZATION ---
async function init() {
    setupAdminNutrientList();
    await fetchMasterFertilizers();
    await fetchUserCalculations();
}

init();