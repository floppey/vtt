import { generateRandomName } from "@/util/generateRandomUser";
import { tryParseJson } from "@/util/tryParseJson";
import { validateObject } from "@/validation/validateObject";
import { StringValidator, TypeValidator } from "@/validation/Validator";
import React, { createContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  name: string;
  color: string;
}

interface UserContextProps extends User {
  isEditing: boolean;
  setEditing: (isEditing: boolean) => void;
  setUserName: (name: string) => void;
  setColor: (color: string) => void;
}

const userSettingValidator: TypeValidator<User> = {
  id: new StringValidator("id must be a string").isRequired().isString(),
  name: new StringValidator("name must be a string").isRequired().isString(),
  color: new StringValidator("color must be a string").isRequired().isString(),
};

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
  const [isEditing, setEditing] = useState<boolean>(true);

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
