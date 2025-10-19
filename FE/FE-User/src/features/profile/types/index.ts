export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: "Male" | "Female" | "Other";
  avatar: any;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: "Male" | "Female";
  color: string;
  weight: string;
  location: string;
  personality: string;
  avatar: any;
  ownerId: string;
}

export interface PetListItem {
  id: string;
  name: string;
  location: string;
  image: any;
}

