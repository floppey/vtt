import { generateRandomName } from "@/util/generateRandomUser";
import React, { createContext, useState, ReactNode } from "react";

interface UserContextProps {
  id: string;
  name: string;
  color: string;
  isEditing: boolean;
  setEditing: (isEditing: boolean) => void;
  setUserName: (name: string) => void;
  setColor: (color: string) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

const defaultColors = ["#FF6633", "#FF33FF", "#E6B333", "#3366E6", "#239966"];
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userName, setUserName] = useState<string>(generateRandomName());
  const [id] = useState<string>(generateRandomName());
  const [color, setColor] = useState<string>(
    Math.floor(Math.random() * defaultColors.length).toString()
  );
  const [isEditing, setEditing] = useState<boolean>(true);
  return (
    <UserContext.Provider
      value={{
        id,
        name: userName,
        color,
        isEditing,
        setUserName,
        setColor,
        setEditing,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
