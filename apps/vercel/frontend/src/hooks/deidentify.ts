import { faker } from '@faker-js/faker';

// Define your original data shape
interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: Date;
}

// Sample data to be de-identified
const sampleData: UserData[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    address: '123 Main St, Anytown, USA',
    dateOfBirth: new Date('1990-01-01'),
  },
  // Add more sample data as needed
];

// Function to de-identify and synthesize data
function deidentifyData<T>(data: T[]): T[] {
  return data.map((user) => ({
    id: user.id,
    name: faker.name.findName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    address: faker.address.streetAddress(),
    dateOfBirth: faker.date.past(30, new Date('2000-01-01')),
  }));
}

// De-identify the sample data
const deidentifiedData = deidentifyData<UserData>(sampleData);

// Output the de-identified data
console.log(deidentifiedData);
