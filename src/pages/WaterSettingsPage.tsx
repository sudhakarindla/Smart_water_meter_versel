import { useState, useEffect } from "react";
import { Droplet, Save, Settings2, Activity, Cpu, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Import your new hooks!
import { 
  useVendorMetersList, 
  useMeterSettingsDetails, 
  useSaveFullSetupMutation 
} from "@/Tanstack/allTanstack";

// --- TYPES ---
interface TapConfig {
 water_type_count: number | string;
  device_type: string;
}

interface WaterSetting {
  water_type_number: number;
  price: number | string;
  time: number | string;
  flow_pulse: number | string;
  liters: number | string;
}

// --- SINGLE ZOD SCHEMA FOR THE ENTIRE PAYLOAD ---
const fullSetupSchema = z.object({
  meter_id: z.string().min(1, "Please select a Meter ID"),
  tap_type: z.number().min(1).max(2),
  taps: z.array(
    z.object({
      tap_number: z.number(),
      device_type: z.string(),
      water_type_count: z.number().min(1).max(3),
      settings: z.array(
        z.object({
          water_type_number: z.number(),
          price: z.coerce.number().min(0, "Price cannot be negative"),
          time: z.coerce.number().min(0),
          flow_pulse: z.coerce.number().min(0),
          liters: z.coerce.number().min(0),
        })
      )
    })
  )
});

const WaterSettings = () => {
  // --- TANSTACK QUERIES ---
  const { data: metersList, isLoading: loadingMeters } = useVendorMetersList();
  const [meterId, setMeterId] = useState("");
  const [isExistingData, setIsExistingData] = useState(false);
  const { data: fetchedSettings, isFetching: loadingSettings } = useMeterSettingsDetails(meterId);
  const saveSetupMutation = useSaveFullSetupMutation();

  // --- STATE ---
  const [tapType, setTapType] = useState<number>(1);
  const [taps, setTaps] = useState<TapConfig[]>([{ water_type_count: 1, device_type: "PUMP" }]);
  const [tapSettings, setTapSettings] = useState<WaterSetting[][]>([
    [{ water_type_number: 1, price: "", time: "", flow_pulse: "", liters: "" }]
  ]);

  // ==========================================
  // SYNC FETCHED DATA FROM BACKEND
  // ==========================================
  useEffect(() => {
    if (fetchedSettings && fetchedSettings.tap_type) {
      setIsExistingData(true); 
      setTapType(fetchedSettings.tap_type);
      
      const sortedTaps = [...fetchedSettings.taps].sort((a: any, b: any) => a.tap_number - b.tap_number);

      const loadedTaps = sortedTaps.map((t: any) => ({
        water_type_count: t.water_type_count,
        device_type: t.device_type || "PUMP"
      }));
      setTaps(loadedTaps);

      const loadedSettings = sortedTaps.map((t: any) => {
        const sortedWaterTypes = [...t.water_types].sort((a: any, b: any) => a.water_type_number - b.water_type_number);
        
        return sortedWaterTypes.map((wt: any) => ({
          water_type_number: wt.water_type_number,
          price: Number(wt.price),
          time: Number(wt.time),
          flow_pulse: Number(wt.flow_pulse),
          liters: Number(wt.liters),
        }));
      });
      
      setTapSettings(loadedSettings);
      toast.success("Loaded existing settings for meter!");

    } else if (meterId) {
      setIsExistingData(false);
      setTapType(1);
      setTaps([{ water_type_count: 1, device_type: "PUMP" }]);
      setTapSettings([[{ water_type_number: 1, price: "", time: "", flow_pulse: "", liters: "" }]]);
    } else {
       setIsExistingData(false);
    }
  }, [fetchedSettings, meterId]);

  // ==========================================
  // CASCADING UI EFFECTS
  // ==========================================
  useEffect(() => {
    if (isExistingData) return; 

    setTaps(prev => {
      const newTaps = [...prev];
      if (newTaps.length < tapType) {
        for (let i = newTaps.length; i < tapType; i++) newTaps.push({ water_type_count: 1, device_type: "PUMP" });
      } else if (newTaps.length > tapType) {
        newTaps.splice(tapType);
      }
      return newTaps;
    });
  }, [tapType, isExistingData]); 

  useEffect(() => {
    if (isExistingData) return;

    setTapSettings(prev => {
      const newSettings = [...prev];
      if (newSettings.length < taps.length) {
        for(let i = newSettings.length; i < taps.length; i++) newSettings.push([{ water_type_number: 1, price: "", time: "", flow_pulse: "", liters: "" }]);
      } else if (newSettings.length > taps.length) {
        newSettings.splice(taps.length);
      }

      taps.forEach((tap, index) => {
        const count = Number(tap.water_type_count) || 1;
        if (!newSettings[index]) newSettings[index] = [];
        let currentSettings = [...newSettings[index]];

        if (currentSettings.length < count) {
          for (let i = currentSettings.length; i < count; i++) currentSettings.push({ water_type_number: i + 1, price: "", time: "", flow_pulse: "", liters: "" });
        } else if (currentSettings.length > count) {
          currentSettings.splice(count);
        }
        newSettings[index] = currentSettings;
      });

      return newSettings;
    });
  }, [taps, isExistingData]); 

  // ==========================================
  // HANDLERS & VALIDATION
  // ==========================================
  const updateTapConfig = (index: number, field: keyof TapConfig, value: string | number) => {
    const newTaps = [...taps];
    newTaps[index] = { ...newTaps[index], [field]: value };
    setTaps(newTaps);
  };

  const updateTapSetting = (tapIndex: number, settingIndex: number, field: keyof WaterSetting, value: number | string) => {
    const newSettings = [...tapSettings];
    newSettings[tapIndex][settingIndex] = { ...newSettings[tapIndex][settingIndex], [field]: value };
    setTapSettings(newSettings);
  };

  // 👇 FIX 1: Helper function to instantly flag negative numbers!
  const isInvalid = (val: string | number) => {
    if (val === "") return false; // Empty is fine until they save
    return Number(val) < 0 || String(val).includes("-");
  };

  // 👇 FIX 2: Check if ANY field has an error so we can disable the Save button
  const hasValidationErrors = tapSettings.some(tap => 
    tap.some(setting => 
      isInvalid(setting.price) || 
      isInvalid(setting.time) || 
      isInvalid(setting.flow_pulse) || 
      isInvalid(setting.liters)
    )
  ) || taps.some(tap => tap.water_type_count !== "" && (Number(tap.water_type_count) > 3 || Number(tap.water_type_count) < 1)); 
  // ==========================================
  // SINGLE SAVE ACTION
  // ==========================================
  const handleSaveAll = () => {
    if (!meterId) return toast.error("Please select a Meter first!");

    const payload = {
      meter_id: meterId,
      tap_type: tapType,
      taps: taps.map((tap, index) => ({
        tap_number: index + 1,
        device_type: tap.device_type,
        water_type_count: Number(tap.water_type_count) || 1,
        settings: tapSettings[index].map(s => ({
          water_type_number: s.water_type_number,
          price: Number(s.price) || 0,
          time: Number(s.time) || 0,
          flow_pulse: Number(s.flow_pulse) || 0,
          liters: Number(s.liters) || 0
        }))
      }))
    };
    
    const validation = fullSetupSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    saveSetupMutation.mutate(payload, {
      onSuccess: () => toast.success("All settings successfully deployed to meter!"),
      onError: (err) => toast.error("Failed to save settings.")
    });
  };

  const inputClass = "w-full bg-background/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "text-[10px] text-muted-foreground font-semibold uppercase tracking-widest block mb-1.5";

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl pb-10">
      
     {/* ================= HEADER ================= */}
      <div className="fixed top-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between backdrop-blur-xl bg-card/90">
        <div>
          <h1 className="text-lg font-extrabold">Device Configuration</h1>
          <p className="text-xs text-muted-foreground">Select a meter and configure its taps and pricing.</p>
        </div>
        
        {!isExistingData ? (
          <button 
            onClick={handleSaveAll} 
            // 👇 FIX 3: Disable button if any field has a negative number!
            disabled={!meterId || saveSetupMutation.isPending || hasValidationErrors}
            className="gradient-primary text-primary-foreground font-bold text-sm uppercase tracking-wider rounded-lg px-6 py-2.5 shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {saveSetupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        ) : (
          <span className="bg-emerald-subtle text-emerald-brand px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald/20 flex items-center gap-2">
             <Activity className="w-3.5 h-3.5" />
             Saved
          </span>
        )}
      </div>

      {/* ================= SECTION 1 ================= */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-card relative mt-24">
        {loadingSettings && (
           <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
           </div>
        )}
        <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
          <Settings2 className="w-5 h-5 text-emerald-brand" />
          <h2 className="text-base font-extrabold text-foreground">Base Configuration</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-4 mt-10">
          <div className="flex-1 w-full">
            <label className={labelClass}>Select Meter</label>
            <select 
              value={meterId} 
              onChange={(e) => setMeterId(e.target.value)} 
              className={inputClass}
              disabled={loadingMeters}
            >
              <option value="">-- Choose a Meter --</option>
              {metersList?.map((m: any) => (
                <option key={m.meter_unique_code} value={m.meter_unique_code}>
                  {m.meter_unique_code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className={labelClass}>Total Taps on Device</label>
            <input 
              type="number" 
              min="1" 
              max="2" 
              value={tapType} 
              onChange={(e) => setTapType(Math.min(2, Math.max(1, Number(e.target.value))))} 
              className={inputClass}
              disabled={!meterId || isExistingData}
            />
          </div>
        </div>
      </div>

      {/* ================= SECTION 2 ================= */}
      {meterId && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
            <Cpu className="w-5 h-5 text-teal-brand" />
            <h2 className="text-base font-extrabold text-foreground">Tap Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taps.map((tap, index) => (
              <div key={index} className="bg-surface2 rounded-xl p-4 border border-border/50">
                <div className="text-xs font-bold text-teal-brand mb-3">TAP {index + 1}</div>
                <div className="space-y-3">
                  {/* 👇 ADDED relative and pb-4 to reserve space for the absolute error text */}
                  <div className="relative pb-4">
                    <label className={labelClass}>Types of Water Supported</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={tap.water_type_count} 
                      disabled={isExistingData}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;

                        const newTaps = [...taps];
                        newTaps[index].water_type_count = val;
                        if (val === "1") newTaps[index].device_type = "PUMP";
                        setTaps(newTaps);
                      }} 
                      onBlur={(e) => {
                        let count = Number(e.target.value);
                        if (count < 1 || isNaN(count)) count = 1;
                        if (count > 3) count = 3;

                        const newTaps = [...taps];
                        newTaps[index].water_type_count = count;
                        if (count === 1) newTaps[index].device_type = "PUMP";
                        setTaps(newTaps);
                      }}
                      className={`${inputClass} ${
                        tap.water_type_count !== "" && (Number(tap.water_type_count) > 3 || Number(tap.water_type_count) < 1) 
                          ? "!border-red-500 focus:!border-red-500 text-red-500" 
                          : ""
                      }`} 
                    />
                    {tap.water_type_count !== "" && (Number(tap.water_type_count) > 3 || Number(tap.water_type_count) < 1) && (
                      <span className="absolute bottom-0 left-0 text-[10px] text-red-500 font-bold leading-none">
                        Enter a value from 1 to 3
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Hardware Device Type</label>
                    <select 
                      value={tap.device_type} 
                      disabled={isExistingData || Number(tap.water_type_count) === 1} 
                      onChange={(e) => updateTapConfig(index, "device_type", e.target.value)} 
                      className={inputClass}
                    >
                      <option value="PUMP">PUMP</option>
                      {Number(tap.water_type_count) > 1 && (
                         <option value="FLOW_SENSOR">FLOW_SENSOR</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 3 ================= */}
      {meterId && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
            <Activity className="w-5 h-5 text-lavender-brand" />
            <h2 className="text-base font-extrabold text-foreground">Pricing & Flow Rates</h2>
          </div>

          <div className="space-y-6">
            {taps.map((tap, tapIndex) => (
              <div key={tapIndex} className="border border-lavender-brand/20 rounded-xl overflow-hidden">
                <div className="bg-lavender-subtle px-4 py-3 border-b border-lavender-brand/20">
                  <div className="font-bold text-sm flex items-center gap-2 text-lavender-brand">
                    <Droplet className="w-4 h-4" /> Config for Tap {tapIndex + 1}
                  </div>
                </div>

                <div className="p-4 space-y-4 bg-background/20">
                  {tapSettings[tapIndex]?.map((setting, settingIndex) => (
                    
                    // 👇 FIX 4: Changed items-end to items-start so the red text has room to render without shifting the layout
                    <div key={settingIndex} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-surface2 p-3 rounded-lg border border-border/40">
                      
                      {/* 👇 ADDED relative and pb-4 to all columns to reserve space for the absolute error text */}
                      <div className="w-12 shrink-0 relative pb-4">
                        <label className={labelClass}>No.</label>
                        <input type="text" value={setting.water_type_number} disabled className="w-full bg-background/20 border border-border rounded-lg px-2 py-2 text-center text-sm font-bold text-muted-foreground outline-none opacity-60 cursor-not-allowed" />
                      </div>
                      
                      <div className="flex-1 min-w-[100px] relative pb-4">
                        <label className={labelClass}>Price (₹)</label>
                        <input 
                          type="number" 
                          value={setting.price} 
                          disabled={isExistingData} 
                          onChange={(e) => updateTapSetting(tapIndex, settingIndex, "price", e.target.value)} 
                          onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                          // 👇 Dynamically apply red border if negative
                          className={`${inputClass} ${isInvalid(setting.price) ? "!border-red-500 focus:!border-red-500 text-red-500" : ""}`} 
                        />
                        {/* 👇 Show tiny red text pinned to the bottom */}
                        {isInvalid(setting.price) && <span className="absolute bottom-0 left-0 text-[10px] text-red-500 font-bold leading-none">Cannot be negative</span>}
                      </div>

                      <div className="flex-1 min-w-[100px] relative pb-4">
                        <label className={labelClass}>Time (sec)</label>
                        <input 
                          type="number" 
                          value={setting.time} 
                          disabled={isExistingData} 
                          onChange={(e) => updateTapSetting(tapIndex, settingIndex, "time", e.target.value)} 
                          onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                          className={`${inputClass} ${isInvalid(setting.time) ? "!border-red-500 focus:!border-red-500 text-red-500" : ""}`} 
                        />
                        {isInvalid(setting.time) && <span className="absolute bottom-0 left-0 text-[10px] text-red-500 font-bold leading-none">Cannot be negative</span>}
                      </div>

                      <div className="flex-1 min-w-[100px] relative pb-4">
                        <label className={labelClass}>Flow Pulse</label>
                        <input 
                          type="number" 
                          value={setting.flow_pulse} 
                          disabled={isExistingData} 
                          onChange={(e) => updateTapSetting(tapIndex, settingIndex, "flow_pulse", e.target.value)} 
                          onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                          className={`${inputClass} ${isInvalid(setting.flow_pulse) ? "!border-red-500 focus:!border-red-500 text-red-500" : ""}`} 
                        />
                        {isInvalid(setting.flow_pulse) && <span className="absolute bottom-0 left-0 text-[10px] text-red-500 font-bold leading-none">Cannot be negative</span>}
                      </div>

                      <div className="flex-1 min-w-[100px] relative pb-4">
                        <label className={labelClass}>Liters</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={setting.liters} 
                          disabled={isExistingData} 
                          onChange={(e) => updateTapSetting(tapIndex, settingIndex, "liters", e.target.value)} 
                          onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                          className={`${inputClass} ${isInvalid(setting.liters) ? "!border-red-500 focus:!border-red-500 text-red-500" : ""}`} 
                        />
                        {isInvalid(setting.liters) && <span className="absolute bottom-0 left-0 text-[10px] text-red-500 font-bold leading-none">Cannot be negative</span>}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default WaterSettings;