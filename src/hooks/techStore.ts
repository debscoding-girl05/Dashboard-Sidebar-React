import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define Slug type
type Slug = string;

// Define Technology interface
interface Technology {
  id: number;
  name: string;
  slug: Slug;
  image: string;
  active: boolean;
  created_At: Date;
}

// Define the techStore interface
interface TechStore {
  techs: Technology[]; // Corrected type here
  addTech: (name: string, image: string, slug: Slug) => void;
}

// Create the Zustand store with persistence
export const useTechStore = create(persist<TechStore>(
  (set) => ({
    techs: [],
    addTech: (name: string, image: string, slug: Slug) =>
      set((state) => ({
        techs: [
          ...state.techs,
          {
            id: Date.now(), // Unique ID based on the current timestamp
            name,
            image,
            slug,
            active: true,
            created_At: new Date(), // Set the current date and time
          },
        ],
      })),
  }),
  {
    name: 'tech-storage', // Updated store name
    storage: createJSONStorage(() => localStorage),
  }
));
