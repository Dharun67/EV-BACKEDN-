import os
import re

files_to_modify = [
    "frontend/src/pages/BatteryStatus.tsx",
    "frontend/src/pages/Payments.tsx",
    "frontend/src/pages/EmergencyRescue.tsx",
    # Add a few major ones to demonstrate the change
]

for file_path in files_to_modify:
    if not os.path.exists(file_path): continue
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Basic transformation for BatteryStatus
    if "BatteryStatus.tsx" in file_path:
        # Import useEffect if needed
        if "useEffect" not in content:
            content = content.replace("useState } from 'react'", "useState, useEffect } from 'react'")
        
        # Import getApi
        if "getApi" not in content:
            content = "import { getApi } from '../utils/api';\n" + content
            
        # Replace the hardcoded mock variables with state
        content = re.sub(
            r"const mockBatteryStatus: any = .*?;\nconst mockChargingHistory: any\[\] = \[\];\nconst mockBatteryInsights: any\[\] = \[\];",
            "",
            content,
            flags=re.DOTALL
        )
        
        # Add state inside component
        state_block = """
  const [mockBatteryStatus, setMockBatteryStatus] = useState<any>({ percentage: 0, energyAvailableKwh: 0, capacityKwh: 0, estimatedRangeKm: 0, status: 'N/A' });
  const [mockChargingHistory, setMockChargingHistory] = useState<any[]>([]);
  const [mockBatteryInsights, setMockBatteryInsights] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getApi<any[]>('battery');
        if (res && res.length > 0) {
            setMockBatteryStatus(res[0]);
        }
      } catch (err) {
        console.error("Failed to fetch battery status", err);
      }
    };
    fetchData();
  }, [isRefreshing]);
"""
        content = content.replace("const [toastMessage, setToastMessage] = useState<string | null>(null);", "const [toastMessage, setToastMessage] = useState<string | null>(null);\n" + state_block)
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

print("Updated BatteryStatus")
