export type EquipmentDetail = {
  equipmentsId: number;
  family: string;
  hour: number;
  licensePlate: string;
  name: string;
  number: string;
  subtype: string;
};

export type Template = {
  templateId: number;
  title: string;
  description: string;
  items: Item[];
};

export type Item = {
  itemId: number;
  item: string;
  order: number;
  isRequired: Boolean;
  options: Option[];
};

export type Option = {
  option: string;
  order: number;
};

export type Checklist = {
  id: number | null;
  templateId: number;
  vehicleId: number;
  checklistStatus: string;
  generalComment: string;
  answers: Answer[];
};

export type Answer = {
  id: number | null;
  itemId: number;
  answer: string;
  comment: string;
};
