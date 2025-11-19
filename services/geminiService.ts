import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, Worker, Site, AttendanceStatus } from "../types";

export const generateMockData = async (
  workers: Worker[],
  site: Site,
  date: string
): Promise<AttendanceRecord[]> => {
  // Strictly use process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Generate realistic construction site attendance records for the date ${date}.
    Site: ${site.name}.
    Workers available: ${JSON.stringify(workers.map(w => ({ id: w.id, role: w.occupation })))}.
    
    Rules:
    - Randomly select about 80% of workers to be present.
    - Start times should be around 07:30 to 08:30.
    - End times should be around 17:00 to 18:00.
    - Create a JSON array of records.
    - Format dates as ISO strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              workerId: { type: Type.STRING },
              checkInTime: { type: Type.STRING },
              checkOutTime: { type: Type.STRING },
            },
            required: ["workerId", "checkInTime", "checkOutTime"]
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    return rawData.map((record: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      siteId: site.id,
      date: date,
      status: AttendanceStatus.CHECKED_OUT,
      ...record
    }));

  } catch (error) {
    console.error("Error generating mock data:", error);
    return [];
  }
};

export const generateStaticMonthData = (
  workers: Worker[],
  site: Site,
  year: number,
  month: number // 1-12
): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here for getDate logic? No, 0 is last day of prev month if using new Date(y, m, 0).
  // Proper way: new Date(year, month, 0) where month is 1-based returns last day of that month.
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();

    // Skip Sundays (0) and some Saturdays (6)
    if (dayOfWeek === 0) continue;
    if (dayOfWeek === 6 && Math.random() > 0.5) continue;

    workers.forEach(w => {
       // 80% chance of attendance
       if (Math.random() > 0.2) {
         const startHour = 7 + Math.random(); // 7:00 - 8:00
         const endHour = 17 + Math.random(); // 17:00 - 18:00
         
         const checkIn = new Date(dateStr);
         checkIn.setHours(Math.floor(startHour), Math.floor((startHour % 1) * 60));
         
         const checkOut = new Date(dateStr);
         checkOut.setHours(Math.floor(endHour), Math.floor((endHour % 1) * 60));

         records.push({
           id: `static-${dateStr}-${w.id}`,
           workerId: w.id,
           siteId: site.id,
           date: dateStr,
           checkInTime: checkIn.toISOString(),
           checkOutTime: checkOut.toISOString(),
           status: AttendanceStatus.CHECKED_OUT
         });
       }
    });
  }
  return records;
};

export const analyzeSiteProductivity = async (
  records: AttendanceRecord[],
  workers: Worker[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Enrich records with worker data for the AI
  const enrichedData = records.map(r => {
    const worker = workers.find(w => w.id === r.workerId);
    return {
      date: r.date,
      role: worker?.occupation,
      start: r.checkInTime,
      end: r.checkOutTime
    };
  });

  const prompt = `
    You are a veteran construction site manager. Analyze the following attendance data.
    Data: ${JSON.stringify(enrichedData.slice(0, 50))} (truncated for brevity)

    Please provide a concise summary in Japanese (Markdown format) covering:
    1. Overall attendance trends.
    2. Observations on work hours.
    3. Resource distribution by role.
    4. A safety or efficiency tip based on the data.
    
    Keep the tone professional but encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "分析データを生成できませんでした。";
  } catch (error) {
    console.error("Analysis error:", error);
    return "エラーが発生しました。もう一度お試しください。";
  }
};