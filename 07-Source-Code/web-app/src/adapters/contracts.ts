import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
  FarmArchiveReadiness,
  FarmAuditEvent,
  FarmManagementContext,
  FarmMember,
  FarmMutationResult,
  FarmProfile,
  FarmProfileDraft,
  FarmStatus,
  MembershipAuditEvent,
  MembershipStatus,
} from '../domain/farm'
import type {
  ReplacePlantingCycleInput,
  TreeImportCandidate,
  TreeImportResult,
  TreeMutationContext,
  TreePositionDetail,
  TreePositionDraft,
  TreePositionSummary,
  UpdatePlantingCycleInput,
} from '../domain/treeRegister'
import type {
  CareEventRecord,
  DiseaseAssessmentInput,
  DiseaseFollowUpInput,
  DiseaseIncidentDraft,
  DiseaseIncidentRecord,
  DiseasePhotoAction,
  DiseasePhotoMockDraft,
  InAppNotification,
  TreatmentWorkOrderInput,
  TreatmentWorkOrderResult,
  WorkAction,
  WorkMutationContext,
  WorkOrderDraft,
  WorkOrderRecord,
  PreparedWorkPhotoUpload,
  WorkPhotoEvidence,
  WorkReportInput,
} from '../domain/workCareDisease'
import type {
  CommercialAuditEvent,
  CommercialMutationContext,
  CommercialSnapshot,
  CropCycleDraft,
  CropCycleRecord,
  CropStage,
  FruitObservationDraft,
  FruitObservationRecord,
  HarvestLotDraft,
  HarvestLotRecord,
  InventoryMovementInput,
  InventoryMovementRecord,
  SalesCorrectionInput,
  SalesLotDraft,
  SalesLotRecord,
} from '../domain/commercialTraceability'
import type {
  ConflictResolution,
  FarmDashboardView,
  FarmExportRecord,
  MasterDataConflict,
  OfflineOperationRecord,
  OperationalAuditEvent,
  OperationalContext,
  PhotoRecoveryDraft,
  PhotoRecoveryRecord,
  PortfolioDashboard,
  QueueOperationInput,
} from '../domain/operationalHardening'
import type {
  DiseaseAnalysisDraft,
  DiseaseAnalysisReviewInput,
  DiseaseAnalysisSessionRecord,
} from '../domain/diseaseAnalysis'
import type {
  AnnualCycleCorrection,
  AnnualCycleDraft,
  AnnualCycleMutationContext,
  AnnualCycleRecord,
  AnnualCycleSnapshot,
  AnnualCycleStatus,
  AnnualPlanItemDraft,
  AnnualPlanItemRecord,
} from '../domain/annualFarmCycle'
import type {
  LaborCostDraft,
  LaborCostRecord,
  ManagementCostSnapshot,
  ManagementReportContext,
  OperatingExpenseDraft,
  OperatingExpenseRecord,
} from '../domain/managementReporting'
import type { AuthAdapterMode, DataAdapterMode } from '../config/environment'

export interface PhoneOtpChallenge {
  challengeId: string
  phoneNumber: string
}

export interface PhoneOtpGateway {
  subscribe(listener: (identity: AuthenticatedIdentity | null) => void): () => void
  requestOtp(phoneNumber: string, verifierContainerId: string): Promise<PhoneOtpChallenge>
  verifyOtp(challenge: PhoneOtpChallenge, code: string): Promise<AuthenticatedIdentity>
  cancelOtp(): void
  signOut(): Promise<void>
}

export interface MembershipChangeInput {
  actor: AuthenticatedIdentity
  organizationId: string
  farmId: string
  targetUserId: string
  nextRole: CanonicalRole
  nextStatus: MembershipStatus
}

export interface CreateFarmInput {
  context: FarmManagementContext
  idempotencyKey: string
  draft: FarmProfileDraft
}

export interface UpdateFarmProfileInput {
  context: FarmManagementContext
  farmId: string
  idempotencyKey: string
  draft: FarmProfileDraft
}

export interface ChangeFarmStatusInput {
  context: FarmManagementContext
  farmId: string
  idempotencyKey: string
  nextStatus: FarmStatus
  knownPendingOperationIds: readonly string[]
}

export interface Phase2Repository {
  listFarmAccess(userId: string): Promise<readonly FarmAccess[]>
  listFarmProfiles(context: FarmManagementContext): Promise<readonly FarmProfile[]>
  getFarmProfile(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmProfile | undefined>
  createFarm(input: CreateFarmInput): Promise<FarmMutationResult>
  updateFarmProfile(input: UpdateFarmProfileInput): Promise<FarmMutationResult>
  getFarmArchiveReadiness(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmArchiveReadiness>
  changeFarmStatus(input: ChangeFarmStatusInput): Promise<FarmMutationResult>
  listFarmAudit(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<readonly FarmAuditEvent[]>
  listFarmMembers(organizationId: string, farmId: string): Promise<readonly FarmMember[]>
  changeFarmMembership(input: MembershipChangeInput): Promise<MembershipAuditEvent>
  listMembershipAudit(
    organizationId: string,
    farmId: string,
  ): Promise<readonly MembershipAuditEvent[]>
}

export interface Phase2Adapters {
  auth: PhoneOtpGateway
  repository: Phase2Repository
  mode: DataAdapterMode
  authMode: AuthAdapterMode
}

export type TreeRouteResolution =
  | { status: 'FOUND'; position: TreePositionDetail }
  | { status: 'UNKNOWN' }
  | { status: 'ACCESS_DENIED' }

export interface TreeRegisterRepository {
  listTreePositions(
    organizationId: string,
    farmId: string,
  ): Promise<readonly TreePositionSummary[]>
  getTreePosition(
    organizationId: string,
    farmId: string,
    positionId: string,
  ): Promise<TreePositionDetail | undefined>
  resolvePositionRoute(
    context: TreeMutationContext,
    positionId: string,
  ): Promise<TreeRouteResolution>
  resolveTag(
    organizationId: string,
    farmId: string,
    tagCode: string,
  ): Promise<TreePositionDetail | undefined>
  createTreePosition(
    context: TreeMutationContext,
    draft: TreePositionDraft,
  ): Promise<TreePositionDetail>
  updateCurrentPlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: UpdatePlantingCycleInput,
  ): Promise<TreePositionDetail>
  replacePlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: ReplacePlantingCycleInput,
  ): Promise<TreePositionDetail>
  archiveTreePosition(
    context: TreeMutationContext,
    positionId: string,
    reason: string,
  ): Promise<TreePositionDetail>
  reportDamagedTag(
    context: TreeMutationContext,
    positionId: string,
    note: string,
  ): Promise<TreePositionDetail>
  importTreePositions(
    context: TreeMutationContext,
    idempotencyKey: string,
    candidates: readonly TreeImportCandidate[],
  ): Promise<TreeImportResult>
}

export interface Phase3Adapters extends Phase2Adapters {
  treeRepository: TreeRegisterRepository
}

export interface WorkCareDiseaseRepository {
  listWorkOrders(context: WorkMutationContext): Promise<readonly WorkOrderRecord[]>
  getWorkOrder(
    context: WorkMutationContext,
    workOrderId: string,
  ): Promise<WorkOrderRecord | undefined>
  createWorkOrder(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: WorkOrderDraft,
  ): Promise<WorkOrderRecord>
  performWorkAction(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    action: WorkAction,
  ): Promise<WorkOrderRecord>
  confirmWorkTarget(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    scannedPositionId: string,
  ): Promise<WorkOrderRecord>
  uploadWorkPhoto(
    context: WorkMutationContext,
    workOrderId: string,
    photoId: string,
    phase: WorkPhotoEvidence['phase'],
    prepared: PreparedWorkPhotoUpload,
  ): Promise<WorkPhotoEvidence>
  saveWorkInstructionPhotos(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    photos: readonly WorkPhotoEvidence[],
  ): Promise<WorkOrderRecord>
  getWorkPhotoUrl(
    context: WorkMutationContext,
    workOrderId: string,
    storagePath: string,
  ): Promise<string>
  saveWorkReport(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    report: WorkReportInput,
  ): Promise<WorkOrderRecord>
  listCareEvents(context: WorkMutationContext): Promise<readonly CareEventRecord[]>
  approveCareEvent(
    context: WorkMutationContext,
    careEventId: string,
    idempotencyKey: string,
  ): Promise<CareEventRecord>
  listDiseaseIncidents(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseIncidentRecord[]>
  createDiseaseIncident(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseIncidentDraft,
  ): Promise<DiseaseIncidentRecord>
  assessDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseAssessmentInput,
  ): Promise<DiseaseIncidentRecord>
  followUpDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseFollowUpInput,
  ): Promise<DiseaseIncidentRecord>
  addDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    draft: DiseasePhotoMockDraft,
  ): Promise<DiseaseIncidentRecord>
  advanceDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    photoId: string,
    idempotencyKey: string,
    action: DiseasePhotoAction,
  ): Promise<DiseaseIncidentRecord>
  createTreatmentWorkOrder(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: TreatmentWorkOrderInput,
  ): Promise<TreatmentWorkOrderResult>
  listNotifications(context: WorkMutationContext): Promise<readonly InAppNotification[]>
}

export interface Phase4Adapters extends Phase3Adapters {
  workRepository: WorkCareDiseaseRepository
}

export interface CommercialTraceabilityRepository {
  listSnapshot(context: CommercialMutationContext): Promise<CommercialSnapshot>
  createCropCycle(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: CropCycleDraft,
  ): Promise<CropCycleRecord>
  advanceCropCycleStage(
    context: CommercialMutationContext,
    cropCycleId: string,
    idempotencyKey: string,
    nextStage: CropStage,
  ): Promise<CropCycleRecord>
  createFruitObservation(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: FruitObservationDraft,
  ): Promise<FruitObservationRecord>
  archiveFruitObservation(
    context: CommercialMutationContext,
    observationId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<FruitObservationRecord>
  createHarvestLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: HarvestLotDraft,
  ): Promise<HarvestLotRecord>
  createSalesLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: SalesLotDraft,
  ): Promise<SalesLotRecord>
  correctSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    input: SalesCorrectionInput,
  ): Promise<SalesLotRecord>
  archiveSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<SalesLotRecord>
  recordInventoryMovement(
    context: CommercialMutationContext,
    idempotencyKey: string,
    input: InventoryMovementInput,
  ): Promise<InventoryMovementRecord>
  listCommercialAudit(
    context: CommercialMutationContext,
  ): Promise<readonly CommercialAuditEvent[]>
  resetMockPack?(): Promise<void>
}

export interface Phase5Adapters extends Phase4Adapters {
  commercialRepository: CommercialTraceabilityRepository
}

export interface OperationalHardeningRepository {
  getFarmDashboard(context: OperationalContext): Promise<FarmDashboardView>
  getPortfolioDashboard(
    actor: AuthenticatedIdentity,
    authorizedFarms: readonly FarmAccess[],
  ): Promise<PortfolioDashboard>
  listOfflineOperations(context: OperationalContext): Promise<readonly OfflineOperationRecord[]>
  queueOfflineOperation(
    context: OperationalContext,
    idempotencyKey: string,
    input: QueueOperationInput,
  ): Promise<OfflineOperationRecord>
  syncOfflineOperation(
    context: OperationalContext,
    operationId: string,
  ): Promise<OfflineOperationRecord>
  listMasterConflicts(context: OperationalContext): Promise<readonly MasterDataConflict[]>
  resolveMasterConflict(
    context: OperationalContext,
    conflictId: string,
    idempotencyKey: string,
    resolution: ConflictResolution,
    reason: string,
  ): Promise<MasterDataConflict>
  listPhotoRecoveries(context: OperationalContext): Promise<readonly PhotoRecoveryRecord[]>
  registerPhotoRecovery(
    context: OperationalContext,
    idempotencyKey: string,
    draft: PhotoRecoveryDraft,
  ): Promise<PhotoRecoveryRecord>
  retryPhotoRecovery(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
  ): Promise<PhotoRecoveryRecord>
  cleanupOrphanPhoto(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<PhotoRecoveryRecord>
  listOperationalAudit(context: OperationalContext): Promise<readonly OperationalAuditEvent[]>
  requestFarmExport(
    context: OperationalContext,
    idempotencyKey: string,
  ): Promise<FarmExportRecord>
  resetMockPack?(): Promise<void>
}

export interface Phase6Adapters extends Phase5Adapters {
  operationalRepository: OperationalHardeningRepository
  diseaseAnalysisRepository: DiseaseAnalysisRepository
  annualCycleRepository: AnnualCycleRepository
  managementReportingRepository: ManagementReportingRepository
  productionMockSeeder?: ProductionMockSeeder
}

export interface ManagementReportingRepository {
  listSnapshot(
    context: ManagementReportContext,
    annualCycleId?: string,
  ): Promise<ManagementCostSnapshot>
  createLaborCost(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: LaborCostDraft,
  ): Promise<LaborCostRecord>
  createOperatingExpense(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: OperatingExpenseDraft,
  ): Promise<OperatingExpenseRecord>
  resetMockPack?(): Promise<void>
}

export interface AnnualCycleRepository {
  listSnapshot(
    context: AnnualCycleMutationContext,
    selectedAnnualCycleId?: string,
  ): Promise<AnnualCycleSnapshot>
  createCycle(
    context: AnnualCycleMutationContext,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
  ): Promise<AnnualCycleRecord>
  updateCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<AnnualCycleRecord>
  transitionCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    nextStatus: AnnualCycleStatus,
    reason: string,
  ): Promise<AnnualCycleRecord>
  correctCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<{ cycle: AnnualCycleRecord; correction: AnnualCycleCorrection }>
  createPlanItem(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualPlanItemDraft,
  ): Promise<AnnualPlanItemRecord>
  resetMockPack?(): Promise<void>
}

export interface ProductionMockSeedResult {
  projectId: 'durian-smartfarm'
  rootPath: 'durian-smartfarm/root'
  classification: 'SIMULATED/TEST ONLY'
  modules: readonly string[]
  recordCount: number
  storageUploadsSkipped: number
}

export interface ProductionMockSeeder {
  seed(actor: AuthenticatedIdentity): Promise<ProductionMockSeedResult>
}

export interface DiseaseAnalysisRepository {
  listDiseaseAnalysisSessions(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseAnalysisSessionRecord[]>
  createDiseaseAnalysisSession(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseAnalysisDraft,
  ): Promise<DiseaseAnalysisSessionRecord>
  reviewDiseaseAnalysisSession(
    context: WorkMutationContext,
    analysisSessionId: string,
    idempotencyKey: string,
    input: DiseaseAnalysisReviewInput,
  ): Promise<DiseaseAnalysisSessionRecord>
  resetMockPack?(): Promise<void>
}
