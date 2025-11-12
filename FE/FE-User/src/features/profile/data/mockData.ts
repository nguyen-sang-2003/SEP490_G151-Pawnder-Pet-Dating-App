import { User, Pet } from "../types";

export const mockUser: User = {
  id: "1",
  name: "John Doe",
  email: "johndoe@gmail.com",
  phone: "0999999999",
  address: "Ha Noi",
  gender: "Male",
  avatar: require("../../../assets/cat_avatar_signin.png"),
};

export const mockPets: Pet[] = [
  {
    id: "1",
    name: "Annie",
    breed: "Persian",
    age: "1 year",
    gender: "Female",
    color: "White",
    weight: "3.5kg",
    location: "England",
    personality: "Calm, gentle",
    avatar: require("../../../assets/cat_avatar.png"),
    ownerId: "1",
  },
  {
    id: "2",
    name: "Coco",
    breed: "British shorthair",
    age: "2 years",
    gender: "Female",
    color: "Grey",
    weight: "4.5kg",
    location: "Ha Noi, Viet Nam",
    personality: "Friendly, playful",
    avatar: require("../../../assets/cat_avatar.png"),
    ownerId: "1",
  },
  {
    id: "3",
    name: "Luna",
    breed: "Siamese",
    age: "3 years",
    gender: "Female",
    color: "Cream",
    weight: "4.0kg",
    location: "Ha Noi, Viet Nam",
    personality: "Energetic, vocal",
    avatar: require("../../../assets/cat_avatar.png"),
    ownerId: "2",
  },
];

