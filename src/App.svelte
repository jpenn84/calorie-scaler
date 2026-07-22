<script>
  import { onMount } from 'svelte';

  let isStandalone = false;
  let isIOS = false;
  let deferredPrompt = null;
  let showIOSPrompt = false;

  onMount(() => {
    isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    isIOS = /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase()) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
  });

  async function handleInstallClick() {
    if (isIOS) {
      showIOSPrompt = true;
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
      }
    }
  }
  let labelCalories = null;
  let labelPortion = null;
  let labelUnit = "Unit";

  let myServing = null;
  let myUnit = "Unit";

  // Unit definition list
  const unitGroups = [
    {
      group: "Generic",
      units: [{ id: "Unit", label: "Unit" }],
    },
    {
      group: "Weight",
      units: [
        { id: "g", label: "Grams (g)" },
        { id: "oz", label: "Ounces (oz)" },
        { id: "kg", label: "Kilograms (kg)" },
        { id: "lb", label: "Pounds (lb)" },
        { id: "mg", label: "Milligrams (mg)" },
      ],
    },
    {
      group: "Volume",
      units: [
        { id: "ml", label: "Milliliters (ml)" },
        { id: "cup", label: "Cups" },
        { id: "tbsp", label: "Tablespoons (tbsp)" },
        { id: "tsp", label: "Teaspoons (tsp)" },
        { id: "fl oz", label: "Fluid Oz (fl oz)" },
        { id: "l", label: "Liters (L)" },
      ],
    },
  ];

  // Reactively lock "My Serving Size" units to match the Label's selected unit category
  $: currentGroup =
    unitGroups.find((g) => g.units.some((u) => u.id === labelUnit))?.group ||
    "Generic";
  $: myUnitGroups = unitGroups.filter((g) => g.group === currentGroup);

  let previousLabelUnit = "Unit";

  // Auto-update 'myUnit' to match 'labelUnit' when 'labelUnit' changes,
  // or if the current 'myUnit' is no longer valid for the category.
  $: {
    if (labelUnit !== previousLabelUnit) {
      myUnit = labelUnit;
      previousLabelUnit = labelUnit;
    } else if (myUnitGroups.length > 0) {
      const isValid = myUnitGroups[0].units.some((u) => u.id === myUnit);
      if (!isValid) {
        myUnit = myUnitGroups[0].units[0].id;
      }
    }
  }

  // Simplified Conversion logic (Same-category only)
  function convertUnit(val, fromUnit, toUnit) {
    if (val === null || val === undefined || isNaN(val) || val <= 0) return 0;
    if (fromUnit === toUnit) return val;
    if (fromUnit === "Unit" || toUnit === "Unit") return val;

    const weightMap = {
      g: 1,
      mg: 0.001,
      kg: 1000,
      oz: 28.349523125,
      lb: 453.59237,
    };

    const volumeMap = {
      ml: 1,
      l: 1000,
      "fl oz": 29.5735296,
      tsp: 4.92892159,
      tbsp: 14.7867648,
      cup: 240,
    };

    const isFromWeight = fromUnit in weightMap;
    const isToWeight = toUnit in weightMap;
    const isFromVol = fromUnit in volumeMap;
    const isToVol = toUnit in volumeMap;

    if (isFromWeight && isToWeight) {
      const grams = val * weightMap[fromUnit];
      return grams / weightMap[toUnit];
    }

    if (isFromVol && isToVol) {
      const mls = val * volumeMap[fromUnit];
      return mls / volumeMap[toUnit];
    }

    return val;
  }

  // Reactive helper calculations
  $: convertedServing = convertUnit(myServing, myUnit, labelUnit);
  $: servingRatio =
    labelPortion && labelPortion > 0 ? convertedServing / labelPortion : 0;
  $: calculatedCalories = Math.round((labelCalories || 0) * servingRatio);

  // Multiplier buttons handler for user serving size
  function setMultiplier(mult) {
    if (!labelPortion) return;
    myServing = Math.round(labelPortion * mult * 100) / 100;
    myUnit = labelUnit;
  }

  function adjustServing(delta) {
    const nextVal = Math.max(0, (Number(myServing) || 0) + delta);
    myServing = Math.round(nextVal * 100) / 100;
  }

  function clearInputs() {
    labelCalories = null;
    labelPortion = null;
    myServing = null;
  }
</script>

<div class="flex-1 flex flex-col pb-28">
  <!-- Top App Navigation / Header -->
  <header
    class="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between"
  >
    <div class="flex items-center space-x-2">
      <div
        class="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-brand-500/20"
      >
        <i class="fa-solid font-black fa-scale-balanced text-sm"></i>
      </div>
      <div>
        <h1
          class="text-base font-extrabold tracking-tight text-white leading-none"
        >
          Calorie Scaler
        </h1>
        <p class="text-[10px] font-medium text-slate-400">
          Portion Calorie Converter
        </p>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <a
        href="https://github.com/jpenn84/calorie-scaler"
        target="_blank"
        rel="noopener noreferrer"
        class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active-scale border border-slate-700 shadow-sm"
        title="View on GitHub"
      >
        <i class="fa-brands fa-github text-lg"></i>
      </a>
      {#if !isStandalone && (deferredPrompt || isIOS)}
        <button 
          on:click={handleInstallClick}
          class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active-scale border border-slate-700 shadow-sm"
          title="Install App"
        >
          <i class="fa-solid fa-download"></i>
        </button>
      {/if}
    </div>
  </header>

  <!-- Main Content Container -->
  <main class="p-4 flex-1 space-y-4">
    <!-- Section 1: Nutrition Label Specifications -->
    <div
      class="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md relative overflow-hidden"
    >
      <div
        class="absolute top-0 right-0 px-3 py-1 bg-slate-800 rounded-bl-xl border-l border-b border-slate-700/50"
      >
        <span
          class="text-[10px] font-bold tracking-wider uppercase text-slate-400"
          >Step 1 • Package Label</span
        >
      </div>

      <div class="flex items-center gap-2 mb-3">
        <div
          class="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs"
        >
          <i class="fa-solid fa-box-archive"></i>
        </div>
        <h2 class="text-sm font-bold text-slate-200">Nutrition Label Info</h2>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <!-- Label Calories -->
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <label
              for="labelCaloriesInput"
              class="block text-xs font-semibold text-slate-400"
            >
              Nutrition Label Calories
            </label>
            <div class="group relative flex items-center">
              <i
                class="fa-regular fa-circle-question text-slate-500 hover:text-slate-300 text-xs cursor-pointer transition-colors"
              ></i>
              <div
                class="absolute bottom-full -left-2.5 mb-2 w-48 p-2.5 bg-slate-800 text-[11px] font-medium text-slate-200 leading-snug rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700 pointer-events-none text-left"
              >
                The total calories listed per serving on the product's nutrition
                label.
                <div
                  class="absolute top-full left-3.5 border-[5px] border-transparent border-t-slate-800"
                ></div>
              </div>
            </div>
          </div>
          <div class="relative flex items-center">
            <input
              id="labelCaloriesInput"
              type="number"
              step="any"
              min="0"
              bind:value={labelCalories}
              placeholder="e.g. 200"
              class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-3 text-lg font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-all pl-10"
            />
            <i
              class="fa-solid fa-fire text-amber-500 absolute left-3.5 text-base pointer-events-none"
            ></i>
            <span
              class="absolute right-3.5 text-xs font-semibold text-slate-400"
              >kcal</span
            >
          </div>
        </div>

        <!-- Label Portion Size & Unit -->
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <label
              for="labelPortionInput"
              class="block text-xs font-semibold text-slate-400"
            >
              Nutrition Label Portion Size
            </label>
            <div class="group relative flex items-center">
              <i
                class="fa-regular fa-circle-question text-slate-500 hover:text-slate-300 text-xs cursor-pointer transition-colors"
              ></i>
              <div
                class="absolute bottom-full -left-2.5 mb-2 w-48 p-2.5 bg-slate-800 text-[11px] font-medium text-slate-200 leading-snug rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700 pointer-events-none text-left"
              >
                The serving size amount listed on the label (e.g., 28g, 1 cup,
                or 2 slices).
                <div
                  class="absolute top-full left-3.5 border-[5px] border-transparent border-t-slate-800"
                ></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-6 relative flex items-center">
              <input
                id="labelPortionInput"
                type="number"
                step="any"
                min="0"
                bind:value={labelPortion}
                placeholder="e.g. 30"
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-3 text-base font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-all pl-9"
              />
              <i
                class="fa-solid fa-scale-balanced text-slate-500 absolute left-3 text-xs pointer-events-none"
              ></i>
            </div>

            <div class="col-span-6">
              <select
                aria-label="Unit selection"
                bind:value={labelUnit}
                class="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 focus:outline-none focus:border-brand-500 transition-all appearance-none cursor-pointer"
                style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 0.65rem;"
              >
                {#each unitGroups as group}
                  <optgroup label={group.group}>
                    {#each group.units as unit}
                      <option value={unit.id}>{unit.label}</option>
                    {/each}
                  </optgroup>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: User Actual Serving Input -->
    <div
      class="bg-slate-900 rounded-2xl p-4 border border-brand-500/40 shadow-lg shadow-brand-500/5 relative overflow-hidden mt-4"
    >
      <div
        class="absolute top-0 right-0 px-3 py-1 bg-brand-500/20 text-brand-400 rounded-bl-xl border-l border-b border-brand-500/30"
      >
        <span class="text-[10px] font-bold tracking-wider uppercase"
          >Step 2 • Your Plate</span
        >
      </div>

      <div class="flex items-center gap-2 mb-3">
        <div
          class="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs"
        >
          <i class="fa-solid fa-utensils"></i>
        </div>
        <h2 class="text-sm font-bold text-white flex items-center gap-1.5">
          My Serving Size
          <div class="group relative flex items-center">
            <i
              class="fa-regular fa-circle-question text-slate-400 hover:text-brand-300 text-xs cursor-pointer transition-colors"
            ></i>
            <div
              class="absolute bottom-full -left-2.5 mb-2 w-48 p-2.5 bg-slate-800 text-[11px] font-medium text-slate-200 leading-snug rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700 pointer-events-none text-left tracking-normal font-sans"
            >
              The actual amount of food you are planning to eat.
              <div
                class="absolute top-full left-3.5 border-[5px] border-transparent border-t-slate-800"
              ></div>
            </div>
          </div>
        </h2>
      </div>

      <div class="grid grid-cols-12 gap-2 mb-3">
        <div class="col-span-6 relative flex items-center">
          <input
            id="myServingInput"
            type="number"
            step="any"
            min="0"
            bind:value={myServing}
            placeholder="e.g. 45"
            class="w-full bg-slate-950 border border-brand-500/60 rounded-xl px-3.5 py-3 text-lg font-black text-brand-400 placeholder-slate-600 focus:outline-none focus:border-brand-400 transition-all pl-9"
          />
          <i
            class="fa-solid fa-weight-scale text-brand-500 absolute left-3 text-xs pointer-events-none"
          ></i>
        </div>

        <div class="col-span-6">
          <select
            aria-label="Unit selection"
            bind:value={myUnit}
            class="w-full bg-slate-950 border border-brand-500/60 rounded-xl px-3 py-3 text-sm font-semibold text-slate-200 focus:outline-none focus:border-brand-400 transition-all appearance-none cursor-pointer"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2334D399%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 0.65rem;"
          >
            <!-- This loop now dynamically reflects ONLY the valid category based on the Label Unit -->
            {#each myUnitGroups as group}
              <optgroup label={group.group}>
                {#each group.units as unit}
                  <option value={unit.id}>{unit.label}</option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </div>
      </div>

      <!-- Quick Adjust / Multiplier Pills -->
      <div class="space-y-2">
        <div
          class="flex items-center justify-between text-[11px] font-semibold text-slate-400"
        >
          <span>Quick Multipliers</span>
          <span>Portion Steppers</span>
        </div>
        <div class="flex items-center justify-between gap-1.5 flex-wrap">
          <div class="flex items-center gap-1">
            {#each [0.5, 1, 1.5, 2, 3] as mult}
              <button
                on:click={() => setMultiplier(mult)}
                class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-300 hover:text-brand-400 active-scale transition-all"
              >
                {mult}x
              </button>
            {/each}
          </div>

          <div class="flex items-center gap-1">
            <button
              on:click={() => adjustServing(-10)}
              class="w-7 h-7 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center active-scale"
              title="-10"
            >
              -10
            </button>
            <button
              on:click={() => adjustServing(10)}
              class="w-7 h-7 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center active-scale"
              title="+10"
            >
              +10
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bottom Fixed Prominent Calculation Display Bar -->
  <footer
    class="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl"
  >
    <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
      <div class="space-y-0.5">
        <div class="flex items-center gap-1.5">
          <span
            class="text-[11px] font-bold tracking-wider uppercase text-slate-400"
            >Calculated Calories</span
          >
          {#if servingRatio > 0 && servingRatio !== 1}
            <span
              class="text-[10px] bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded font-mono font-bold"
            >
              {Math.round(servingRatio * 100) / 100}x label
            </span>
          {/if}
        </div>

        <div class="flex items-baseline gap-1.5">
          <span class="text-3xl font-black tracking-tight text-white font-mono">
            {isNaN(calculatedCalories) ? 0 : calculatedCalories}
          </span>
          <span
            class="text-xs font-bold text-brand-400 uppercase tracking-wider"
            >Calories</span
          >
        </div>
      </div>

      <button
        on:click={clearInputs}
        class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-700 active-scale shadow-sm"
      >
        <i class="fa-solid fa-rotate-right text-sm"></i>
        <span class="text-sm">Clear</span>
      </button>
    </div>
  </footer>
</div>

{#if showIOSPrompt}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4">
      <div class="flex justify-between items-start">
        <h3 class="text-lg font-bold text-white">Install Calorie Scaler</h3>
        <button on:click={() => showIOSPrompt = false} class="text-slate-400 hover:text-white p-1" aria-label="Close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <p class="text-slate-300 text-sm">
        To install this app on your iPhone or iPad, tap the <i class="fa-solid fa-arrow-up-from-bracket mx-1"></i> <strong>Share</strong> button at the bottom of Safari and select <strong>"Add to Home Screen"</strong>.
      </p>
      <button 
        on:click={() => showIOSPrompt = false}
        class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
      >
        Got it!
      </button>
    </div>
  </div>
{/if}
