export interface Defect {
  id: number;
  defectNo: string;
  description: string;
  severityId: number;
  severityName: string;
  priorityId: number;
  priorityName: string;
  statusId: number;
  statusName: string;
  statusColor?: string;
  defectTypeId: number;
  defectTypeName: string;
  moduleId: number;
  moduleName: string;
  subModuleId: number;
  subModuleName: string;
  releaseId: number;
  releaseName: string;
  assignedToId: number;
  assignedToName: string;
  createdByName: string;
  [key: string]: any; // To allow sending back the full object with modifications
}

export interface Status {
  id:number;
  name:string;
  color:string;
}


export interface StatusTransition {
  id:number;
  fromStatus: Status;
  toStatus: Status;
}

export interface Developer {
  id: number;
  name: string;
}

export interface DefectFilters {
  searchTerm?: string;
  moduleId?: number;
  subModuleId?: number;
  defectTypeId?: number;
  severityId?: number;
  priorityId?: number;
  releaseId?: number;
  statusId?: number;
  assignedToId?: number;
  enteredById?: number;
}
