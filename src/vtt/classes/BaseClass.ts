import { generateGuid } from "@/util/generateGuid";

export class BaseClass {
  #id: string;

  constructor() {
    this.#id = generateGuid();
  }

  get id(): string {
    return this.#id;
  }

  set id(id: string) {
    this.#id = id;
  }
}
