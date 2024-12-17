import { generateRandomName } from "@/util/generateRandomUser";
import { tryParseJson } from "@/util/tryParseJson";
import { userSettingValidator } from "@/validation/premadeValidators";
import { validateObject } from "@/validation/validateObject";
import React, { createContext, useState, ReactNode, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  color: string;
}

interface UserContextProps extends User {
  setUserName: (name: string) => void;
  setColor: (color: string) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

const defaultColors = ["#FF6633", "#FF33FF", "#E6B333", "#3366E6", "#239966"];

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userName, setUserName] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [color, setColor] = useState<string>(
    defaultColors[Math.floor(Math.random() * defaultColors.length - 1)]
  );

  useEffect(() => {
    const storedUser = tryParseJson<User>(
      localStorage.getItem("user"),
      userSettingValidator
    );
    if (storedUser) {
      setUserName(storedUser.name);
      setColor(storedUser.color);
      setId(storedUser.id);
    } else {
      const randomName = generateRandomName();
      setUserName(randomName);
      setId(randomName);
    }
  }, []);

  useEffect(() => {
    const user: User = { id, name: userName, color };
    const validation = validateObject(user, userSettingValidator);

    if (validation.isValid) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [id, userName, color]);

  return (
    <UserContext.Provider
      value={{
        id,
        name: userName,
        color,
        setUserName,
        setColor,
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
