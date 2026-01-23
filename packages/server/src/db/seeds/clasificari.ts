import { db } from "../index";
import { clasificari } from "../schema";

/**
 * Seed data from HG 2139/2004 - Catalogul privind clasificarea și duratele
 * normale de funcționare a mijloacelor fixe
 *
 * Grupa I - Construcții
 * Grupa II - Echipamente tehnologice (mașini, utilaje, instalații)
 * Grupa III - Aparate și instalații de măsurare, control și reglare
 */
const clasificariData = [
  // ============================================================================
  // GRUPA I - CONSTRUCTII
  // ============================================================================
  // 1.1 Clădiri
  {
    cod: "1.1.1",
    denumire: "Clădiri industriale cu structură de beton armat sau metalică",
    grupa: "I",
    durataNormalaMin: 40,
    durataNormalaMax: 60,
    cotaAmortizare: "2.00",
  },
  {
    cod: "1.1.2",
    denumire: "Clădiri industriale cu structură de zidărie",
    grupa: "I",
    durataNormalaMin: 30,
    durataNormalaMax: 50,
    cotaAmortizare: "2.50",
  },
  {
    cod: "1.1.3",
    denumire: "Clădiri administrative cu structură de beton armat",
    grupa: "I",
    durataNormalaMin: 40,
    durataNormalaMax: 60,
    cotaAmortizare: "2.00",
  },
  {
    cod: "1.1.4",
    denumire: "Clădiri administrative cu structură de zidărie",
    grupa: "I",
    durataNormalaMin: 30,
    durataNormalaMax: 50,
    cotaAmortizare: "2.50",
  },
  {
    cod: "1.1.5",
    denumire: "Clădiri pentru locuințe, cu structură de beton armat",
    grupa: "I",
    durataNormalaMin: 50,
    durataNormalaMax: 80,
    cotaAmortizare: "1.50",
  },
  {
    cod: "1.1.6",
    denumire: "Clădiri pentru învățământ și cercetare",
    grupa: "I",
    durataNormalaMin: 40,
    durataNormalaMax: 60,
    cotaAmortizare: "2.00",
  },
  {
    cod: "1.1.7",
    denumire: "Clădiri pentru sănătate (spitale, policlinici)",
    grupa: "I",
    durataNormalaMin: 40,
    durataNormalaMax: 60,
    cotaAmortizare: "2.00",
  },
  {
    cod: "1.1.8",
    denumire: "Clădiri comerciale și de alimentație publică",
    grupa: "I",
    durataNormalaMin: 30,
    durataNormalaMax: 50,
    cotaAmortizare: "2.50",
  },
  {
    cod: "1.1.9",
    denumire: "Hale și magazii",
    grupa: "I",
    durataNormalaMin: 25,
    durataNormalaMax: 40,
    cotaAmortizare: "3.00",
  },
  {
    cod: "1.1.10",
    denumire: "Garaje și parcări acoperite",
    grupa: "I",
    durataNormalaMin: 25,
    durataNormalaMax: 40,
    cotaAmortizare: "3.00",
  },

  // 1.2 Construcții speciale
  {
    cod: "1.2.1",
    denumire: "Drumuri și platforme betonate",
    grupa: "I",
    durataNormalaMin: 20,
    durataNormalaMax: 40,
    cotaAmortizare: "3.50",
  },
  {
    cod: "1.2.2",
    denumire: "Drumuri și platforme asfaltate",
    grupa: "I",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },
  {
    cod: "1.2.3",
    denumire: "Poduri din beton armat",
    grupa: "I",
    durataNormalaMin: 40,
    durataNormalaMax: 60,
    cotaAmortizare: "2.00",
  },
  {
    cod: "1.2.4",
    denumire: "Poduri metalice",
    grupa: "I",
    durataNormalaMin: 30,
    durataNormalaMax: 50,
    cotaAmortizare: "2.50",
  },
  {
    cod: "1.2.5",
    denumire: "Rețele de canalizare",
    grupa: "I",
    durataNormalaMin: 25,
    durataNormalaMax: 40,
    cotaAmortizare: "3.00",
  },
  {
    cod: "1.2.6",
    denumire: "Rețele de apă",
    grupa: "I",
    durataNormalaMin: 20,
    durataNormalaMax: 35,
    cotaAmortizare: "4.00",
  },
  {
    cod: "1.2.7",
    denumire: "Rețele de gaze",
    grupa: "I",
    durataNormalaMin: 20,
    durataNormalaMax: 35,
    cotaAmortizare: "4.00",
  },
  {
    cod: "1.2.8",
    denumire: "Rețele electrice",
    grupa: "I",
    durataNormalaMin: 20,
    durataNormalaMax: 30,
    cotaAmortizare: "4.00",
  },
  {
    cod: "1.2.9",
    denumire: "Împrejmuiri din beton sau zidărie",
    grupa: "I",
    durataNormalaMin: 20,
    durataNormalaMax: 40,
    cotaAmortizare: "3.50",
  },
  {
    cod: "1.2.10",
    denumire: "Împrejmuiri din plasă de sârmă",
    grupa: "I",
    durataNormalaMin: 10,
    durataNormalaMax: 20,
    cotaAmortizare: "6.50",
  },

  // ============================================================================
  // GRUPA II - ECHIPAMENTE TEHNOLOGICE
  // ============================================================================
  // 2.1 Mașini, utilaje și instalații de lucru
  {
    cod: "2.1.1",
    denumire: "Strunguri universale și specializate",
    grupa: "II",
    durataNormalaMin: 10,
    durataNormalaMax: 18,
    cotaAmortizare: "7.00",
  },
  {
    cod: "2.1.2",
    denumire: "Mașini de frezat",
    grupa: "II",
    durataNormalaMin: 10,
    durataNormalaMax: 18,
    cotaAmortizare: "7.00",
  },
  {
    cod: "2.1.3",
    denumire: "Mașini de rectificat",
    grupa: "II",
    durataNormalaMin: 10,
    durataNormalaMax: 15,
    cotaAmortizare: "8.00",
  },
  {
    cod: "2.1.4",
    denumire: "Mașini de găurit",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 15,
    cotaAmortizare: "8.50",
  },
  {
    cod: "2.1.5",
    denumire: "Centre de prelucrare CNC",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },
  {
    cod: "2.1.6",
    denumire: "Prese hidraulice și mecanice",
    grupa: "II",
    durataNormalaMin: 12,
    durataNormalaMax: 20,
    cotaAmortizare: "6.00",
  },
  {
    cod: "2.1.7",
    denumire: "Mașini de sudat",
    grupa: "II",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "2.1.8",
    denumire: "Compresoare",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 15,
    cotaAmortizare: "8.50",
  },
  {
    cod: "2.1.9",
    denumire: "Pompe industriale",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },
  {
    cod: "2.1.10",
    denumire: "Ventilatoare industriale",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },

  // 2.2 Aparate și instalații energetice
  {
    cod: "2.2.1",
    denumire: "Transformatoare electrice",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },
  {
    cod: "2.2.2",
    denumire: "Generatoare electrice",
    grupa: "II",
    durataNormalaMin: 12,
    durataNormalaMax: 20,
    cotaAmortizare: "6.00",
  },
  {
    cod: "2.2.3",
    denumire: "Motoare electrice",
    grupa: "II",
    durataNormalaMin: 10,
    durataNormalaMax: 18,
    cotaAmortizare: "7.00",
  },
  {
    cod: "2.2.4",
    denumire: "Tablouri electrice de distribuție",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },
  {
    cod: "2.2.5",
    denumire: "Grupuri electrogene",
    grupa: "II",
    durataNormalaMin: 10,
    durataNormalaMax: 15,
    cotaAmortizare: "8.00",
  },
  {
    cod: "2.2.6",
    denumire: "Cazane de abur și apă caldă",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },
  {
    cod: "2.2.7",
    denumire: "Instalații de climatizare",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 15,
    cotaAmortizare: "8.50",
  },
  {
    cod: "2.2.8",
    denumire: "Centrale termice",
    grupa: "II",
    durataNormalaMin: 12,
    durataNormalaMax: 20,
    cotaAmortizare: "6.00",
  },
  {
    cod: "2.2.9",
    denumire: "Panouri solare și fotovoltaice",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },
  {
    cod: "2.2.10",
    denumire: "UPS-uri și surse neîntreruptibile",
    grupa: "II",
    durataNormalaMin: 5,
    durataNormalaMax: 10,
    cotaAmortizare: "14.00",
  },

  // 2.3 Mijloace de transport
  {
    cod: "2.3.1",
    denumire: "Autoturisme",
    grupa: "II",
    durataNormalaMin: 4,
    durataNormalaMax: 6,
    cotaAmortizare: "20.00",
  },
  {
    cod: "2.3.2",
    denumire: "Autoutilitare și camionete",
    grupa: "II",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "2.3.3",
    denumire: "Autocamioane",
    grupa: "II",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "2.3.4",
    denumire: "Autobuze și microbuze",
    grupa: "II",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "2.3.5",
    denumire: "Tractoare",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },
  {
    cod: "2.3.6",
    denumire: "Motostivuitoare",
    grupa: "II",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "2.3.7",
    denumire: "Elevatoare și transpalete",
    grupa: "II",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "2.3.8",
    denumire: "Macarale și poduri rulante",
    grupa: "II",
    durataNormalaMin: 12,
    durataNormalaMax: 20,
    cotaAmortizare: "6.00",
  },
  {
    cod: "2.3.9",
    denumire: "Benzi transportoare",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 15,
    cotaAmortizare: "8.50",
  },
  {
    cod: "2.3.10",
    denumire: "Ascensoare pentru persoane și mărfuri",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },

  // 2.4 Echipamente IT și de birou
  {
    cod: "2.4.1",
    denumire: "Calculatoare și stații de lucru",
    grupa: "II",
    durataNormalaMin: 2,
    durataNormalaMax: 4,
    cotaAmortizare: "33.33",
  },
  {
    cod: "2.4.2",
    denumire: "Servere și echipamente de rețea",
    grupa: "II",
    durataNormalaMin: 3,
    durataNormalaMax: 5,
    cotaAmortizare: "25.00",
  },
  {
    cod: "2.4.3",
    denumire: "Imprimante și copiatoare",
    grupa: "II",
    durataNormalaMin: 3,
    durataNormalaMax: 5,
    cotaAmortizare: "25.00",
  },
  {
    cod: "2.4.4",
    denumire: "Monitoare și display-uri",
    grupa: "II",
    durataNormalaMin: 3,
    durataNormalaMax: 5,
    cotaAmortizare: "25.00",
  },
  {
    cod: "2.4.5",
    denumire: "Echipamente de stocare date (NAS, SAN)",
    grupa: "II",
    durataNormalaMin: 3,
    durataNormalaMax: 5,
    cotaAmortizare: "25.00",
  },
  {
    cod: "2.4.6",
    denumire: "Centrale telefonice",
    grupa: "II",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "2.4.7",
    denumire: "Sisteme de videoconferință",
    grupa: "II",
    durataNormalaMin: 3,
    durataNormalaMax: 5,
    cotaAmortizare: "25.00",
  },
  {
    cod: "2.4.8",
    denumire: "Aparate de aer condiționat de birou",
    grupa: "II",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "2.4.9",
    denumire: "Mobilier de birou",
    grupa: "II",
    durataNormalaMin: 8,
    durataNormalaMax: 15,
    cotaAmortizare: "8.50",
  },
  {
    cod: "2.4.10",
    denumire: "Seifuri și dulapuri metalice",
    grupa: "II",
    durataNormalaMin: 15,
    durataNormalaMax: 25,
    cotaAmortizare: "5.00",
  },

  // ============================================================================
  // GRUPA III - APARATE SI INSTALATII DE MASURARE, CONTROL SI REGLARE
  // ============================================================================
  {
    cod: "3.1.1",
    denumire: "Aparate de măsurat mărimi electrice",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.1.2",
    denumire: "Aparate de măsurat mărimi mecanice",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.1.3",
    denumire: "Aparate de măsurat temperatură și presiune",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.1.4",
    denumire: "Aparate de măsurat debit și nivel",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.1.5",
    denumire: "Cântare și balanțe electronice",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.1.6",
    denumire: "Aparate de laborator pentru analize chimice",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.1.7",
    denumire: "Microscoape și echipamente optice",
    grupa: "III",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },
  {
    cod: "3.1.8",
    denumire: "Osciloscoape și analizoare de semnal",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.1.9",
    denumire: "Sisteme de automatizare și PLC-uri",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.1.10",
    denumire: "Echipamente de control calitate",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.2.1",
    denumire: "Camere video de supraveghere",
    grupa: "III",
    durataNormalaMin: 4,
    durataNormalaMax: 6,
    cotaAmortizare: "20.00",
  },
  {
    cod: "3.2.2",
    denumire: "Sisteme de control acces",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.2.3",
    denumire: "Sisteme de alarmă și detecție",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.2.4",
    denumire: "Detectoare de fum și incendiu",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
  {
    cod: "3.2.5",
    denumire: "Echipamente GPS și de localizare",
    grupa: "III",
    durataNormalaMin: 4,
    durataNormalaMax: 6,
    cotaAmortizare: "20.00",
  },
  {
    cod: "3.3.1",
    denumire: "Echipamente medicale de diagnostic",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.3.2",
    denumire: "Echipamente de radiologie",
    grupa: "III",
    durataNormalaMin: 8,
    durataNormalaMax: 12,
    cotaAmortizare: "10.00",
  },
  {
    cod: "3.3.3",
    denumire: "Echipamente de stomatologie",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.3.4",
    denumire: "Echipamente de fizioterapie",
    grupa: "III",
    durataNormalaMin: 6,
    durataNormalaMax: 10,
    cotaAmortizare: "12.00",
  },
  {
    cod: "3.3.5",
    denumire: "Aparatură medicală de laborator",
    grupa: "III",
    durataNormalaMin: 5,
    durataNormalaMax: 8,
    cotaAmortizare: "16.00",
  },
];

export async function seedClasificari() {
  console.log("Seeding clasificari (HG 2139/2004)...");

  // Check if data already exists
  const existing = await db.select().from(clasificari).limit(1);
  if (existing.length > 0) {
    console.log("Clasificari already seeded, skipping...");
    return;
  }

  // Insert in batches for better performance
  const batchSize = 50;
  for (let i = 0; i < clasificariData.length; i += batchSize) {
    const batch = clasificariData.slice(i, i + batchSize);
    await db.insert(clasificari).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clasificariData.length / batchSize)}`);
  }

  console.log(`✓ Seeded ${clasificariData.length} clasificari entries`);
}

// Allow running directly: bun run src/db/seeds/clasificari.ts
if (import.meta.main) {
  seedClasificari()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
