const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Carol",
  "David",
  "Erin",
  "Frank",
  "Grace",
  "Henry",
  "Iris",
  "Jack",
] as const;

const LAST_NAMES = [
  "Smith",
  "Jones",
  "Garcia",
  "Kim",
  "Chen",
  "Patel",
  "Miller",
  "Davis",
  "Lopez",
  "Nguyen",
] as const;

const COMPLAINTS = [
  "chest pain",
  "migraine",
  "fractured wrist",
  "flu symptoms",
  "back pain",
  "annual checkup",
] as const;

export type Patient = {
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  ssn: string;
  dob: string;
  zip: string;
};

export type Encounter = {
  patient_id: string;
  admit_date: string;
  discharge_date: string;
  notes: string;
};

function dateString(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function addOneDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function buildFixture(patientCount: number): {
  patients: Patient[];
  encounters: Encounter[];
} {
  const patients: Patient[] = [];
  const encounters: Encounter[] = [];

  for (let i = 0; i < patientCount; i += 1) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const last = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]!;
    const ssn = [
      String(100 + ((i * 37) % 900)),
      String((i * 53) % 100).padStart(2, "0"),
      String((i * 97) % 10_000).padStart(4, "0"),
    ].join("-");
    const phone = [
      String(200 + ((i * 29) % 800)),
      String((i * 43) % 1_000).padStart(3, "0"),
      String((i * 61) % 10_000).padStart(4, "0"),
    ].join("-");
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
    const patientId = `p-${String(i + 1).padStart(6, "0")}`;
    const dob = dateString(
      1940 + ((i * 7) % 70),
      1 + ((i * 5) % 12),
      1 + ((i * 11) % 28),
    );
    const zip = String(10_000 + ((i * 7_919) % 90_000));
    patients.push({
      patient_id: patientId,
      first_name: first,
      last_name: last,
      email,
      phone,
      ssn,
      dob,
      zip,
    });

    for (let j = 0; j < 1 + (i % 3); j += 1) {
      const admitDate = dateString(
        2023 + ((i + j) % 3),
        1 + ((i * 3 + j * 5) % 12),
        1 + ((i * 7 + j * 11) % 27),
      );
      const complaint = COMPLAINTS[(i + j) % COMPLAINTS.length]!;
      encounters.push({
        patient_id: patientId,
        admit_date: admitDate,
        discharge_date: addOneDay(admitDate),
        notes:
          `Patient ${first} ${last} presented with ${complaint}. ` +
          `Contact at ${email} or ${phone}. SSN on file: ${ssn}.`,
      });
    }
  }

  return { patients, encounters };
}
