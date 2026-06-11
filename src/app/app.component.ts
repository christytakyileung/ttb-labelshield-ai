import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface AppData {
  brandName: string;
  classType: string;
  abv: string;
  netContents: string;
}

interface MockAnalysis {
  extractedBrandName: string;
  brandMatchStatus: string;
  brandAnalysis: string;
  extractedABV: string;
  abvMatchStatus: string;
  abvAnalysis: string;
  extractedNetContents: string;
  netContentsMatchStatus: string;
  netContentsAnalysis: string;
  warningStatementPresent: boolean;
  warningStatementText: string;
  warningIsAllCapsAndBold: boolean;
  warningMatchStatus: string;
  warningAnalysis: string;
  overallRecommendation: string;
  confidenceScore: number;
}

interface PresetLabel {
  id: string;
  name: string;
  imageUrl: string;
  appData: AppData;
  mockAnalysis: MockAnalysis;
}

const PRESET_LABELS: PresetLabel[] = [
  {
    id: 'old-tom-bourbon',
    name: 'Old Tom Distillery (Compliant)',
    imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&q=80&w=600',
    appData: {
      brandName: 'OLD TOM DISTILLERY',
      classType: 'Kentucky Straight Bourbon Whiskey',
      abv: '45% Alc./Vol. (90 Proof)',
      netContents: '750 mL',
    },
    mockAnalysis: {
      extractedBrandName: 'OLD TOM DISTILLERY',
      brandMatchStatus: 'MATCH',
      brandAnalysis: 'Matches exactly with the application registration data.',
      extractedABV: '45% Alc./Vol. (90 Proof)',
      abvMatchStatus: 'MATCH',
      abvAnalysis: 'ABV and proof details match perfectly.',
      extractedNetContents: '750 mL',
      netContentsMatchStatus: 'MATCH',
      netContentsAnalysis: 'Net contents matches registration specification.',
      warningStatementPresent: true,
      warningStatementText: 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.',
      warningIsAllCapsAndBold: true,
      warningMatchStatus: 'MATCH',
      warningAnalysis: 'The Government Warning is present, in all caps, and correctly formatted in bold typeface at the footer.',
      overallRecommendation: 'APPROVE',
      confidenceScore: 98,
    }
  },
  {
    id: 'stones-throw-gin',
    name: "Stone's Throw (Case Discrepancy)",
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600',
    appData: {
      brandName: "Stone's Throw",
      classType: 'Artisanal Dry Gin',
      abv: '42% ABV',
      netContents: '750 mL',
    },
    mockAnalysis: {
      extractedBrandName: "STONE'S THROW",
      brandMatchStatus: 'SOFT_MISMATCH',
      brandAnalysis: "The label displays 'STONE'S THROW' in all caps, while the application specifies 'Stone's Throw'. This is flagged as a safe case-variance.",
      extractedABV: '42% ABV',
      abvMatchStatus: 'MATCH',
      abvAnalysis: 'ABV content matches exactly.',
      extractedNetContents: '750 mL',
      netContentsMatchStatus: 'MATCH',
      netContentsAnalysis: 'Net contents match exactly.',
      warningStatementPresent: true,
      warningStatementText: 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy...',
      warningIsAllCapsAndBold: true,
      warningMatchStatus: 'MATCH',
      warningAnalysis: 'Government Warning is validly printed and fully compliant.',
      overallRecommendation: 'REVIEW',
      confidenceScore: 88,
    }
  },
  {
    id: 'red-creek-wine',
    name: 'Red Creek Vineyard (ABV Mismatch & Warning Case Error)',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600',
    appData: {
      brandName: 'RED CREEK VINEYARD',
      classType: 'Cabernet Sauvignon',
      abv: '13.5% ABV',
      netContents: '750 mL',
    },
    mockAnalysis: {
      extractedBrandName: 'RED CREEK VINEYARD',
      brandMatchStatus: 'MATCH',
      brandAnalysis: 'Brand matches exactly.',
      extractedABV: '14.5% ABV',
      abvMatchStatus: 'MISMATCH',
      abvAnalysis: "CRITICAL: The label printed ABV is 14.5% but the application specifies 13.5%. This is outside allowed tolerance range.",
      extractedNetContents: '750 mL',
      netContentsMatchStatus: 'MATCH',
      netContentsAnalysis: 'Net contents match exactly.',
      warningStatementPresent: true,
      warningStatementText: 'Government Warning: (1) According to the Surgeon General...',
      warningIsAllCapsAndBold: false,
      warningMatchStatus: 'FORMATTING_ERROR',
      warningAnalysis: "VIOLATION: The warning text starts with 'Government Warning' in title case instead of required 'GOVERNMENT WARNING:' in all-caps.",
      overallRecommendation: 'REJECT',
      confidenceScore: 65,
    }
  }
];

const TTB_STANDARD_WARNING = "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header class="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="bg-indigo-600 p-2.5 rounded-lg text-white shadow-lg">
            ⚡
          </div>
          <div>
            <h1 class="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              TTB LabelShield AI
            </h1>
            <p class="text-xs text-slate-400">Federal Modernized Alcohol Verification Console</p>
          </div>
        </div>

        <nav class="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button (click)="activeTab.set('workspace')" [class]="'px-4 py-2 rounded-lg text-xs font-semibold ' + (activeTab() === 'workspace' ? 'bg-indigo-600 text-white' : 'text-slate-400')">🔍 Verify Workspace</button>
          <button (click)="activeTab.set('batch')" [class]="'px-4 py-2 rounded-lg text-xs font-semibold ' + (activeTab() === 'batch' ? 'bg-indigo-600 text-white' : 'text-slate-400')">📦 Batch Verification</button>
          <button (click)="activeTab.set('generator')" [class]="'px-4 py-2 rounded-lg text-xs font-semibold ' + (activeTab() === 'generator' ? 'bg-indigo-600 text-white' : 'text-slate-400')">🎨 AI Label Gen</button>
          <button (click)="activeTab.set('analytics')" [class]="'px-4 py-2 rounded-lg text-xs font-semibold ' + (activeTab() === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400')">📊 Queue Analytics</button>
        </nav>
      </header>

      <main class="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        @if (activeTab() === 'workspace') {
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-5 flex flex-col gap-6">
              <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xs font-extrabold text-slate-400 uppercase">Verification Profile</h3>
                  <div class="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button (click)="setMode('dave')" [class]="'px-3 py-1.5 text-xs ' + (verificationMode() === 'dave' ? 'bg-indigo-600 text-white rounded' : 'text-slate-400')">Dave's Nuance</button>
                    <button (click)="setMode('jenny')" [class]="'px-3 py-1.5 text-xs ' + (verificationMode() === 'jenny' ? 'bg-rose-600 text-white rounded' : 'text-slate-400')">Jenny's Strict</button>
                  </div>
                </div>

                <div class="space-y-2">
                  @for (preset of PRESET_LABELS; track preset.id) {
                    <button (click)="selectPreset(preset.id)" [class]="'w-full flex items-start p-3 rounded-xl border text-left ' + (selectedPresetId() === preset.id ? 'bg-indigo-950/40 border-indigo-500/70' : 'bg-slate-900/60 border-slate-800')">
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-slate-200 truncate">{{ preset.name }}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">Brand: {{ preset.appData.brandName }}</div>
                      </div>
                    </button>
                  }
                </div>
              </div>

              <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex-1">
                <h3 class="font-bold text-xs text-slate-300 uppercase mb-4 pb-2 border-b border-slate-850">COLA Registry Record</h3>
                <div class="space-y-3.5">
                  <div>
                    <label class="block text-[10px] font-extrabold text-indigo-400 uppercase mb-1">Brand Name</label>
                    <input type="text" [value]="brandNameInput()" (input)="brandNameInput.set($any($event.target).value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] font-extrabold text-indigo-400 uppercase mb-1">Class Type</label>
                      <input type="text" [value]="classTypeInput()" (input)="classTypeInput.set($any($event.target).value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-extrabold text-indigo-400 uppercase mb-1">Target ABV</label>
                      <input type="text" [value]="abvInput()" (input)="abvInput.set($any($event.target).value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono" />
                    </div>
                  </div>
                  <button (click)="runVerification()" [disabled]="isScanning()" class="w-full py-3 rounded-xl font-bold text-xs uppercase bg-indigo-600 text-white disabled:opacity-40">
                    @if (isScanning()) { {{ scanStep() }} } @else { ⚡ Run Compliance Scan }
                  </button>
                </div>
              </div>
            </div>

            <div class="xl:col-span-7 flex flex-col gap-6">
              <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px]">
                <div class="lg:col-span-5 bg-slate-900/80 rounded-xl p-3 flex items-center justify-center relative">
                  <img [src]="customImage() || getPresetImage()" class="max-h-[300px] object-contain rounded-lg" />
                </div>
                <div class="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <h3 class="font-bold text-xs uppercase text-slate-300 mb-3 border-b border-slate-850 pb-2">Compliance Output</h3>
                    @if (analysisResult() && !isScanning()) {
                      <div class="space-y-2 max-h-[260px] overflow-y-auto">
                        <div class="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                          <div class="font-bold text-slate-200">🏷️ Brand Rule Match Status: {{ analysisResult().brandMatchStatus }}</div>
                          <p class="text-[10px] text-slate-400 mt-1">{{ analysisResult().brandAnalysis }}</p>
                        </div>
                        <div class="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                          <div class="font-bold text-slate-200">🍷 ABV Volume Rule: {{ analysisResult().abvMatchStatus }}</div>
                          <p class="text-[10px] text-slate-400 mt-1">{{ analysisResult().abvAnalysis }}</p>
                        </div>
                        <div class="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                          <div class="font-bold text-slate-200">⚠️ Government Stamp Check: {{ analysisResult().warningMatchStatus }}</div>
                          <p class="text-[10px] text-slate-400 mt-1">{{ analysisResult().warningAnalysis }}</p>
                        </div>
                      </div>
                    } @else {
                      <p class="text-slate-500 text-xs">Ready for inspection scan sequence.</p>
                    }
                  </div>
                  @if (analysisResult() && !isScanning()) {
                    <div class="grid grid-cols-3 gap-2 mt-4">
                      <button (click)="handleDecisionSubmit('APPROVED')" class="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs py-2 rounded">Approve</button>
                      <button (click)="handleDecisionSubmit('REJECTED')" class="bg-rose-950 text-rose-400 border border-rose-900 text-xs py-2 rounded">Reject</button>
                      <button (click)="handleDecisionSubmit('ESCALATED')" class="bg-amber-950 text-amber-400 border border-amber-900 text-xs py-2 rounded">Escalate</button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'batch') {
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-sm font-bold text-slate-200">Bulk Queue Processing Frame</h2>
              <button (click)="startBatchProcess()" class="bg-indigo-600 text-xs px-4 py-2 rounded text-white font-bold">⚡ Run Bulk Pipeline</button>
            </div>
            <table class="w-full text-left text-xs">
              <thead><tr class="text-[10px] text-slate-400 font-bold border-b border-slate-800"><th class="p-2">Asset Name</th><th class="p-2">Expected Brand</th><th class="p-2">Status</th></tr></thead>
              <tbody>
                @for (item of batchItems(); track item.id) {
                  <tr class="border-b border-slate-850"><td class="p-2 font-bold">{{ item.name }}</td><td class="p-2">{{ item.brand }}</td><td class="p-2"><span class="text-indigo-400 font-bold">{{ item.status }}</span></td></tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (activeTab() === 'generator') {
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-xl mx-auto">
            <h2 class="text-sm font-bold text-slate-200 mb-4">QA Test Label Canvas Generator</h2>
            <input type="text" [value]="generatorBrand()" (input)="generatorBrand.set($any($event.target).value)" class="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs mb-3 text-white" />
            <button (click)="triggerImageGeneration()" class="w-full bg-indigo-600 py-2 rounded text-xs text-white font-bold">✨ Construct Mock Asset</button>
          </div>
        }

        @if (activeTab() === 'analytics') {
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-slate-950 p-4 rounded border border-slate-800"><span class="text-[10px] uppercase text-slate-400 font-bold">Latency metrics</span><div class="text-lg font-bold text-indigo-400">2.4 Seconds</div></div>
            <div class="bg-slate-950 p-4 rounded border border-slate-800"><span class="text-[10px] uppercase text-slate-400 font-bold">Auto Pass Margin</span><div class="text-lg font-bold text-emerald-400">84.5%</div></div>
            <div class="bg-slate-950 p-4 rounded border border-slate-800"><span class="text-[10px] uppercase text-slate-400 font-bold">Flagged Discrepancies</span><div class="text-lg font-bold text-rose-400">15.5%</div></div>
          </div>
        }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  activeTab = signal<'workspace' | 'batch' | 'generator' | 'analytics'>('workspace');
  verificationMode = signal<'dave' | 'jenny'>('dave');
  selectedPresetId = signal<string>('old-tom-bourbon');
  brandNameInput = signal<string>('OLD TOM DISTILLERY');
  classTypeInput = signal<string>('Kentucky Straight Bourbon Whiskey');
  abvInput = signal<string>('45% Alc./Vol. (90 Proof)');
  netContentsInput = signal<string>('750 mL');
  customImage = signal<string | null>(null);
  customImageBase64 = signal<string>('');
  isScanning = signal<boolean>(false);
  scanStep = signal<string>('');
  analysisResult = signal<any>(PRESET_LABELS[0].mockAnalysis);
  completedAudits = signal<any[]>([]);
  batchItems = signal<any[]>([
    { id: 1, name: 'Batch_Item_01_OldTom.jpg', brand: 'OLD TOM DISTILLERY', status: 'Pending' },
    { id: 2, name: 'Batch_Item_02_RedCreek.jpg', brand: 'RED CREEK VINEYARD', status: 'Pending' },
  ]);
  generatorBrand = signal<string>('WILD MOUNTAIN');
  generatedImageUrl = signal<string | null>(null);
  isGenerating = signal<boolean>(false);

  getPresetImage() { return PRESET_LABELS.find(p => p.id === this.selectedPresetId())?.imageUrl || ''; }
  setMode(mode: 'dave' | 'jenny') { this.verificationMode.set(mode); this.runOfflineMatching(); }
  selectPreset(id: string) {
    this.selectedPresetId.set(id);
    const p = PRESET_LABELS.find(x => x.id === id);
    if (p) {
      this.brandNameInput.set(p.appData.brandName);
      this.classTypeInput.set(p.appData.classType);
      this.abvInput.set(p.appData.abv);
      this.netContentsInput.set(p.appData.netContents);
      this.analysisResult.set(p.mockAnalysis);
      this.customImage.set(null);
    }
  }
  handleImageUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      this.customImage.set(URL.createObjectURL(file));
      this.selectedPresetId.set('');
      this.analysisResult.set(null);
    }
  }
  runOfflineMatching() {
    const p = PRESET_LABELS.find(x => x.id === this.selectedPresetId());
    if (p) { this.analysisResult.set(p.mockAnalysis); return; }
    this.analysisResult.set({
      brandMatchStatus: "MATCH", brandAnalysis: "Fuzzy check clear.",
      abvMatchStatus: "MATCH", abvAnalysis: "Valid threshold alignment.",
      warningMatchStatus: "MATCH", warningAnalysis: "Standard warning statement present.",
      overallRecommendation: "APPROVE", confidenceScore: 95
    });
  }
  async runVerification() {
    this.isScanning.set(true); this.scanStep.set('Scanning Matrix...');
    await new Promise(r => setTimeout(r, 1000));
    this.runOfflineMatching(); this.isScanning.set(false);
  }
  handleDecisionSubmit(status: string) {
    this.completedAudits.set([{ id: Date.now(), brandName: this.brandNameInput(), status }, ...this.completedAudits()]);
  }
  async startBatchProcess() {
    this.isProcessingBatch.set(true);
    this.batchItems.update(arr => arr.map(it => ({ ...it, status: 'Processing...' })));
    await new Promise(r => setTimeout(r, 1500));
    this.batchItems.update(arr => arr.map(it => ({ ...it, status: 'Compliant ✓' })));
    this.isProcessingBatch.set(false);
  }
  async triggerImageGeneration() {
    this.isGenerating.set(true); await new Promise(r => setTimeout(r, 1000));
    const url = 'https://images.unsplash.com/photo-1569529465841-dfedd87500f1?auto=format&fit=crop&q=80&w=600';
    this.generatedImageUrl.set(url); this.customImage.set(url); this.brandNameInput.set(this.generatorBrand().toUpperCase());
    this.selectedPresetId.set(''); this.analysisResult.set(null); this.isGenerating.set(false); this.activeTab.set('workspace');
  }
}
