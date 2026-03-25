/**
 * Utility to convert an array of objects to a CSV string and trigger a download.
 */
export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        
        // Convert to string for processing
        let strVal = String(val);
        
        // Handle arrays (e.g., recommendations)
        if (Array.isArray(val)) {
          strVal = val.join('; ');
        }
        
        // Escape double quotes by doubling them
        // If the value contains a comma, newline, or double quote, wrap it in double quotes
        if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        
        return strVal;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a realistic dataset for disease outbreak risk assessment.
 */
export function generateSampleDataset() {
  const regions = ['Karnataka', 'Kerala', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra', 'West Bengal'];
  const data: any[] = [];

  regions.forEach((region, rIdx) => {
    // Dengue: High cases, High risk
    const dScore = 75 + Math.floor(Math.random() * 15) + (rIdx % 5); 
    const dCases = 2800 + Math.floor(Math.random() * 1200) + (rIdx * 113);
    const dTrend = 10 + Math.floor(Math.random() * 12) + (rIdx % 3);
    data.push({
      Disease: 'Dengue',
      'Risk Level': dScore < 35 ? 'Low' : dScore < 65 ? 'Moderate' : dScore < 88 ? 'High' : 'Critical',
      Score: dScore,
      'Predicted Cases': dCases,
      'Trend %': `+${dTrend}%`,
      Description: `Technical analysis for ${region} indicates high vector density due to post-monsoon stagnation.`,
      Recommendations: "Eliminate stagnant water; Use mosquito nets; Protective clothing"
    });

    // Malaria: Moderate-High cases, Moderate risk
    const mScore = 45 + Math.floor(Math.random() * 25) + (rIdx % 7);
    const mCases = 1600 + Math.floor(Math.random() * 1000) + (rIdx * 87);
    const mTrend = 4 + Math.floor(Math.random() * 8) + (rIdx % 2);
    data.push({
      Disease: 'Malaria',
      'Risk Level': mScore < 35 ? 'Low' : mScore < 65 ? 'Moderate' : mScore < 88 ? 'High' : 'Critical',
      Score: mScore,
      'Predicted Cases': mCases,
      'Trend %': `+${mTrend}%`,
      Description: `Stochastic modeling suggests optimal Plasmodium development temperatures in ${region}.`,
      Recommendations: "Indoor residual spraying; Repellent usage; Clear bushes"
    });

    // Cholera: Moderate cases, Water-dependent
    const cScore = 25 + Math.floor(Math.random() * 20) + (rIdx % 4);
    const cCases = 400 + Math.floor(Math.random() * 800) + (rIdx * 43);
    const cTrend = Math.floor(Math.random() * 12) - 6 + (rIdx % 3);
    data.push({
      Disease: 'Cholera',
      'Risk Level': cScore < 35 ? 'Low' : cScore < 65 ? 'Moderate' : cScore < 88 ? 'High' : 'Critical',
      Score: cScore,
      'Predicted Cases': cCases,
      'Trend %': cTrend >= 0 ? `+${cTrend}%` : `${cTrend}%`,
      Description: `Regression analysis identifies water contamination risks in ${region} following precipitation.`,
      Recommendations: "Boil drinking water; Hand hygiene; Sanitation monitoring"
    });
  });

  // Shuffle to look natural
  return data.sort(() => Math.random() - 0.5);
}
