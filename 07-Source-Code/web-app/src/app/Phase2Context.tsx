import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Outlet } from 'react-router-dom'

import type {
  MembershipChangeInput,
  Phase6Adapters,
  PhoneOtpChallenge,
  ProductionMockSeedResult,
  TreeRouteResolution,
} from '../adapters/contracts'
import { createRuntimeAdapters } from '../adapters/runtimeAdapters'
import { Phase2Context } from './usePhase2'
import type {
  AuthenticatedIdentity,
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
} from '../domain/farm'
import type {
  ReplacePlantingCycleInput,
  TreeImportCandidate,
  TreeImportResult,
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
  WorkOrderDraft,
  WorkOrderRecord,
  WorkPhotoEvidence,
  WorkReportInput,
} from '../domain/workCareDisease'
import type {
  CommercialAuditEvent,
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
  SalesLotFinancialRecord,
  SalesLotRecord,
} from '../domain/commercialTraceability'
import type {
  ConflictResolution,
  FarmDashboardView,
  FarmExportRecord,
  MasterDataConflict,
  OfflineOperationRecord,
  OperationalAuditEvent,
  PhotoRecoveryDraft,
  PhotoRecoveryRecord,
  PortfolioDashboard,
  QueueOperationInput,
} from '../domain/operationalHardening'
import type {
  CreateWorkPhotoBinaryBatchInput,
  WorkPhotoBinaryBatch,
  WorkPhotoBinaryQueueScope,
} from '../services/workPhotoBinaryQueue'
import type {
  DiseaseAnalysisDraft,
  DiseaseAnalysisReviewInput,
  DiseaseAnalysisSessionRecord,
} from '../domain/diseaseAnalysis'
import type {
  AnnualCycleCorrection,
  AnnualCycleDraft,
  AnnualCycleRecord,
  AnnualCycleSnapshot,
  AnnualCycleStatus,
  AnnualPlanItemDraft,
  AnnualPlanItemRecord,
} from '../domain/annualFarmCycle'
import {
  buildFarmManagementReport,
  type FarmManagementReport,
  type LaborCostDraft,
  type LaborCostRecord,
  type ManagementCostSnapshot,
  type OperatingExpenseDraft,
  type OperatingExpenseRecord,
  type ReportPeriodKind,
} from '../domain/managementReporting'

interface PendingOperation {
  operationId: string
  organizationId: string
  farmId: string
  label: string
}

export type QueueWorkPhotoBinaryBatchInput = Omit<
  CreateWorkPhotoBinaryBatchInput,
  'farm' | 'actorUserId' | 'exampleData'
>

export interface Phase2ContextValue {
  mode: Phase6Adapters['mode']
  authMode: Phase6Adapters['authMode']
  developmentAdminSignInAvailable: boolean
  identity: AuthenticatedIdentity | null | undefined
  farms: readonly FarmAccess[]
  currentFarm: FarmAccess | undefined
  farmsLoading: boolean
  authError: string | undefined
  otpChallenge: PhoneOtpChallenge | undefined
  pendingOperations: readonly PendingOperation[]
  pendingSwitchTarget: FarmAccess | undefined
  annualCycleSnapshot: AnnualCycleSnapshot
  annualCyclesLoading: boolean
  selectAnnualCycle: (annualCycleId: string) => void
  refreshAnnualCycles: () => Promise<AnnualCycleSnapshot>
  createAnnualCycle: (
    idempotencyKey: string,
    draft: AnnualCycleDraft,
  ) => Promise<AnnualCycleRecord>
  updateAnnualCycle: (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ) => Promise<AnnualCycleRecord>
  transitionAnnualCycle: (
    annualCycleId: string,
    idempotencyKey: string,
    nextStatus: AnnualCycleStatus,
    reason: string,
  ) => Promise<AnnualCycleRecord>
  correctAnnualCycle: (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ) => Promise<{ cycle: AnnualCycleRecord; correction: AnnualCycleCorrection }>
  createAnnualPlanItem: (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualPlanItemDraft,
  ) => Promise<AnnualPlanItemRecord>
  listManagementCostSnapshot: () => Promise<ManagementCostSnapshot>
  createLaborCost: (
    idempotencyKey: string,
    draft: LaborCostDraft,
  ) => Promise<LaborCostRecord>
  createOperatingExpense: (
    idempotencyKey: string,
    draft: OperatingExpenseDraft,
  ) => Promise<OperatingExpenseRecord>
  generateManagementReport: (
    kind: ReportPeriodKind,
    anchorDate: string,
  ) => Promise<FarmManagementReport>
  resetManagementReportingMockData: () => Promise<void>
  requestOtp: (phoneNumber: string) => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  cancelOtp: () => void
  signInAsDevelopmentAdmin: () => Promise<void>
  signInWithMockAccount: (phoneNumber: string, otp: string) => Promise<void>
  seedProductionMockData: () => Promise<ProductionMockSeedResult>
  signOut: () => Promise<void>
  requestFarmSwitch: (farmId: string) => void
  confirmFarmSwitch: () => void
  cancelFarmSwitch: () => void
  addDemoPendingOperation: () => void
  clearDemoPendingOperations: () => void
  listFarmProfiles: () => Promise<readonly FarmProfile[]>
  getFarmProfile: (farmId: string) => Promise<FarmProfile | undefined>
  createFarm: (
    idempotencyKey: string,
    draft: FarmProfileDraft,
  ) => Promise<FarmMutationResult>
  updateFarmProfile: (
    farmId: string,
    idempotencyKey: string,
    draft: FarmProfileDraft,
  ) => Promise<FarmMutationResult>
  getFarmArchiveReadiness: (farmId: string) => Promise<FarmArchiveReadiness>
  changeFarmStatus: (
    farmId: string,
    idempotencyKey: string,
    nextStatus: FarmStatus,
  ) => Promise<FarmMutationResult>
  listFarmAudit: (farmId: string) => Promise<readonly FarmAuditEvent[]>
  listFarmMembers: () => Promise<readonly FarmMember[]>
  changeFarmMembership: (
    input: Omit<MembershipChangeInput, 'actor' | 'organizationId' | 'farmId'>,
  ) => Promise<MembershipAuditEvent>
  listMembershipAudit: () => Promise<readonly MembershipAuditEvent[]>
  listTreePositions: () => Promise<readonly TreePositionSummary[]>
  getTreePosition: (positionId: string) => Promise<TreePositionDetail | undefined>
  resolvePositionRoute: (positionId: string) => Promise<TreeRouteResolution>
  resolveTag: (tagCode: string) => Promise<TreePositionDetail | undefined>
  createTreePosition: (draft: TreePositionDraft) => Promise<TreePositionDetail>
  updateCurrentPlantingCycle: (
    positionId: string,
    input: UpdatePlantingCycleInput,
  ) => Promise<TreePositionDetail>
  replacePlantingCycle: (
    positionId: string,
    input: ReplacePlantingCycleInput,
  ) => Promise<TreePositionDetail>
  archiveTreePosition: (
    positionId: string,
    reason: string,
  ) => Promise<TreePositionDetail>
  reportDamagedTag: (positionId: string, note: string) => Promise<TreePositionDetail>
  importTreePositions: (
    idempotencyKey: string,
    candidates: readonly TreeImportCandidate[],
  ) => Promise<TreeImportResult>
  listWorkOrders: () => Promise<readonly WorkOrderRecord[]>
  getWorkOrder: (workOrderId: string) => Promise<WorkOrderRecord | undefined>
  createWorkOrder: (
    idempotencyKey: string,
    draft: WorkOrderDraft,
  ) => Promise<WorkOrderRecord>
  performWorkAction: (
    workOrderId: string,
    idempotencyKey: string,
    action: WorkAction,
  ) => Promise<WorkOrderRecord>
  confirmWorkTarget: (
    workOrderId: string,
    idempotencyKey: string,
    scannedPositionId: string,
  ) => Promise<WorkOrderRecord>
  uploadWorkPhoto: (
    workOrderId: string,
    photoId: string,
    phase: WorkPhotoEvidence['phase'],
    file: Blob,
  ) => Promise<WorkPhotoEvidence>
  saveWorkInstructionPhotos: (
    workOrderId: string,
    idempotencyKey: string,
    photos: readonly WorkPhotoEvidence[],
  ) => Promise<WorkOrderRecord>
  getWorkPhotoUrl: (
    workOrderId: string,
    storagePath: string,
  ) => Promise<string>
  saveWorkReport: (
    workOrderId: string,
    idempotencyKey: string,
    report: WorkReportInput,
  ) => Promise<WorkOrderRecord>
  listCareEvents: () => Promise<readonly CareEventRecord[]>
  approveCareEvent: (
    careEventId: string,
    idempotencyKey: string,
  ) => Promise<CareEventRecord>
  listDiseaseIncidents: () => Promise<readonly DiseaseIncidentRecord[]>
  createDiseaseIncident: (
    idempotencyKey: string,
    draft: DiseaseIncidentDraft,
  ) => Promise<DiseaseIncidentRecord>
  assessDiseaseIncident: (
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseAssessmentInput,
  ) => Promise<DiseaseIncidentRecord>
  followUpDiseaseIncident: (
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseFollowUpInput,
  ) => Promise<DiseaseIncidentRecord>
  addDiseasePhotoMock: (
    incidentId: string,
    idempotencyKey: string,
    draft: DiseasePhotoMockDraft,
  ) => Promise<DiseaseIncidentRecord>
  advanceDiseasePhotoMock: (
    incidentId: string,
    photoId: string,
    idempotencyKey: string,
    action: DiseasePhotoAction,
  ) => Promise<DiseaseIncidentRecord>
  createTreatmentWorkOrder: (
    incidentId: string,
    idempotencyKey: string,
    input: TreatmentWorkOrderInput,
  ) => Promise<TreatmentWorkOrderResult>
  listNotifications: () => Promise<readonly InAppNotification[]>
  listDiseaseAnalysisSessions: () => Promise<readonly DiseaseAnalysisSessionRecord[]>
  createDiseaseAnalysisSession: (
    idempotencyKey: string,
    draft: DiseaseAnalysisDraft,
  ) => Promise<DiseaseAnalysisSessionRecord>
  reviewDiseaseAnalysisSession: (
    analysisSessionId: string,
    idempotencyKey: string,
    input: DiseaseAnalysisReviewInput,
  ) => Promise<DiseaseAnalysisSessionRecord>
  listCommercialSnapshot: () => Promise<CommercialSnapshot>
  createCropCycle: (
    idempotencyKey: string,
    draft: CropCycleDraft,
  ) => Promise<CropCycleRecord>
  advanceCropCycleStage: (
    cropCycleId: string,
    idempotencyKey: string,
    nextStage: CropStage,
  ) => Promise<CropCycleRecord>
  createFruitObservation: (
    idempotencyKey: string,
    draft: FruitObservationDraft,
  ) => Promise<FruitObservationRecord>
  archiveFruitObservation: (
    observationId: string,
    idempotencyKey: string,
    reason: string,
  ) => Promise<FruitObservationRecord>
  createHarvestLot: (
    idempotencyKey: string,
    draft: HarvestLotDraft,
  ) => Promise<HarvestLotRecord>
  createSalesLot: (
    idempotencyKey: string,
    draft: SalesLotDraft,
  ) => Promise<SalesLotRecord>
  correctSalesLot: (
    salesLotId: string,
    idempotencyKey: string,
    input: SalesCorrectionInput,
  ) => Promise<SalesLotFinancialRecord>
  archiveSalesLot: (
    salesLotId: string,
    idempotencyKey: string,
    reason: string,
  ) => Promise<SalesLotRecord>
  recordInventoryMovement: (
    idempotencyKey: string,
    input: InventoryMovementInput,
  ) => Promise<InventoryMovementRecord>
  listCommercialAudit: () => Promise<readonly CommercialAuditEvent[]>
  resetPhase5MockData: () => Promise<void>
  getFarmDashboard: () => Promise<FarmDashboardView>
  getPortfolioDashboard: () => Promise<PortfolioDashboard>
  listOfflineOperations: () => Promise<readonly OfflineOperationRecord[]>
  queueOfflineOperation: (
    idempotencyKey: string,
    input: QueueOperationInput,
  ) => Promise<OfflineOperationRecord>
  syncOfflineOperation: (operationId: string) => Promise<OfflineOperationRecord>
  listMasterConflicts: () => Promise<readonly MasterDataConflict[]>
  resolveMasterConflict: (
    conflictId: string,
    idempotencyKey: string,
    resolution: ConflictResolution,
    reason: string,
  ) => Promise<MasterDataConflict>
  listPhotoRecoveries: () => Promise<readonly PhotoRecoveryRecord[]>
  registerPhotoRecovery: (
    idempotencyKey: string,
    draft: PhotoRecoveryDraft,
  ) => Promise<PhotoRecoveryRecord>
  retryPhotoRecovery: (
    recoveryId: string,
    idempotencyKey: string,
  ) => Promise<PhotoRecoveryRecord>
  queueWorkPhotoBinaryBatch: (
    input: QueueWorkPhotoBinaryBatchInput,
  ) => Promise<WorkPhotoBinaryBatch>
  checkpointQueuedWorkPhoto: (
    batchId: string,
    evidence: WorkPhotoEvidence,
  ) => Promise<void>
  removeQueuedWorkPhotoBatch: (batchId: string) => Promise<void>
  listQueuedWorkPhotoBatches: () => Promise<readonly WorkPhotoBinaryBatch[]>
  retryQueuedWorkPhotoBatch: (batchId: string) => Promise<WorkOrderRecord>
  cleanupOrphanPhoto: (
    recoveryId: string,
    idempotencyKey: string,
    reason: string,
  ) => Promise<PhotoRecoveryRecord>
  listOperationalAudit: () => Promise<readonly OperationalAuditEvent[]>
  requestFarmExport: (idempotencyKey: string) => Promise<FarmExportRecord>
  resetPhase6MockData: () => Promise<void>
}

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}

function chooseInitialFarm(farms: readonly FarmAccess[]): FarmAccess | undefined {
  if (farms.length === 0) return undefined
  const storedFarmId = sessionStorage.getItem('kdoms.currentFarmId')
  return farms.find((farm) => farm.farmId === storedFarmId) ?? farms[0]
}

function ResolvedPhase2Provider({
  adapters,
  activateDevelopmentAdmin,
  children,
}: {
  adapters: Phase6Adapters
  activateDevelopmentAdmin: () => Promise<void>
  children?: ReactNode
}) {
  const [identity, setIdentity] = useState<AuthenticatedIdentity | null | undefined>()
  const [farms, setFarms] = useState<readonly FarmAccess[]>([])
  const [currentFarmId, setCurrentFarmId] = useState<string>()
  const [farmsLoading, setFarmsLoading] = useState(false)
  const [authError, setAuthError] = useState<string>()
  const [otpChallenge, setOtpChallenge] = useState<PhoneOtpChallenge>()
  const [pendingOperations, setPendingOperations] = useState<readonly PendingOperation[]>([])
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<FarmAccess>()
  const [annualCycleSnapshot, setAnnualCycleSnapshot] = useState<AnnualCycleSnapshot>({
    cycles: [], selectedCycle: null, planItems: [], corrections: [], audit: [],
  })
  const [annualCyclesLoading, setAnnualCyclesLoading] = useState(false)

  const loadFarmAccess = useCallback(
    async (nextIdentity: AuthenticatedIdentity) => {
      setFarmsLoading(true)
      try {
        const nextFarms = await adapters.repository.listFarmAccess(nextIdentity.userId)
        setFarms(nextFarms)
        const initial = chooseInitialFarm(nextFarms)
        setCurrentFarmId(initial?.farmId)
      } catch (error) {
        setAuthError(readableError(error))
        setFarms([])
        setCurrentFarmId(undefined)
      } finally {
        setFarmsLoading(false)
      }
    },
    [adapters.repository],
  )

  useEffect(() => {
    return adapters.auth.subscribe((nextIdentity) => {
      setIdentity(nextIdentity)
      setAuthError(undefined)
      setOtpChallenge(undefined)
      setPendingSwitchTarget(undefined)
      if (nextIdentity) {
        void loadFarmAccess(nextIdentity)
      } else {
        setFarms([])
        setCurrentFarmId(undefined)
        setFarmsLoading(false)
        setPendingOperations([])
      }
    })
  }, [adapters.auth, loadFarmAccess])

  const currentFarm = farms.find((farm) => farm.farmId === currentFarmId)

  const loadAnnualCycles = useCallback(async (
    requestedAnnualCycleId?: string,
  ): Promise<AnnualCycleSnapshot> => {
    if (!identity || !currentFarm) {
      const empty: AnnualCycleSnapshot = {
        cycles: [], selectedCycle: null, planItems: [], corrections: [], audit: [],
      }
      setAnnualCycleSnapshot(empty)
      return empty
    }
    setAnnualCyclesLoading(true)
    try {
      const storedId = sessionStorage.getItem(`kdoms.annualCycleId.${currentFarm.farmId}`) ?? undefined
      const next = await adapters.annualCycleRepository.listSnapshot(
        { actor: identity, farm: currentFarm },
        requestedAnnualCycleId ?? storedId,
      )
      setAnnualCycleSnapshot(next)
      if (next.selectedCycle) {
        sessionStorage.setItem(
          `kdoms.annualCycleId.${currentFarm.farmId}`,
          next.selectedCycle.annualCycleId,
        )
      }
      return next
    } finally {
      setAnnualCyclesLoading(false)
    }
  }, [adapters.annualCycleRepository, currentFarm, identity])

  useEffect(() => {
    if (!identity || !currentFarm) return
    const timeoutId = window.setTimeout(() => {
      void loadAnnualCycles()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [currentFarm, identity, loadAnnualCycles])

  const selectAnnualCycle = useCallback((annualCycleId: string) => {
    if (!annualCycleSnapshot.cycles.some((cycle) => cycle.annualCycleId === annualCycleId)) {
      throw new Error('ไม่พบรอบปีในสวนปัจจุบัน')
    }
    void loadAnnualCycles(annualCycleId)
  }, [annualCycleSnapshot.cycles, loadAnnualCycles])

  const requestOtp = useCallback(
    async (phoneNumber: string) => {
      setAuthError(undefined)
      setOtpChallenge(undefined)
      try {
        const challenge = await adapters.auth.requestOtp(
          phoneNumber,
          'firebase-recaptcha-container',
        )
        setOtpChallenge(challenge)
      } catch (error) {
        setAuthError(readableError(error))
        throw error
      }
    },
    [adapters.auth],
  )

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!otpChallenge) {
        const error = new Error('กรุณาขอรหัส OTP ก่อน')
        setAuthError(error.message)
        throw error
      }
      setAuthError(undefined)
      try {
        await adapters.auth.verifyOtp(otpChallenge, code)
      } catch (error) {
        setAuthError(readableError(error))
        throw error
      }
    },
    [adapters.auth, otpChallenge],
  )

  const cancelOtp = useCallback(() => {
    adapters.auth.cancelOtp()
    setAuthError(undefined)
    setOtpChallenge(undefined)
  }, [adapters.auth])

  const signInAsDevelopmentAdmin = useCallback(async () => {
    setAuthError(undefined)
    setOtpChallenge(undefined)
    try {
      await activateDevelopmentAdmin()
    } catch (error) {
      setAuthError(readableError(error))
      throw error
    }
  }, [activateDevelopmentAdmin])

  const signInWithMockAccount = useCallback(
    async (phoneNumber: string, code: string) => {
      if (adapters.authMode !== 'mock') {
        const error = new Error('การเข้าใช้แบบคลิกเดียวเปิดได้เฉพาะ Mock mode')
        setAuthError(error.message)
        throw error
      }
      setAuthError(undefined)
      try {
        const challenge = await adapters.auth.requestOtp(
          phoneNumber,
          'firebase-recaptcha-container',
        )
        setOtpChallenge(challenge)
        await adapters.auth.verifyOtp(challenge, code)
      } catch (error) {
        setAuthError(readableError(error))
        throw error
      }
    },
    [adapters.auth, adapters.authMode],
  )

  const signOut = useCallback(async () => {
    if (identity) {
      const { workPhotoBinaryQueue } = await import('../services/workPhotoBinaryQueue')
      await Promise.all(farms.map((farm) => workPhotoBinaryQueue.clearScope({
        organizationId: farm.organizationId,
        farmId: farm.farmId,
        actorUserId: identity.userId,
      })))
    }
    await adapters.auth.signOut()
  }, [adapters.auth, farms, identity])

  const seedProductionMockData = useCallback(async () => {
    if (!identity || !adapters.productionMockSeeder) {
      throw new Error('ปุ่ม Seed ใช้ได้หลังยืนยัน Firebase Phone Auth ใน Production เท่านั้น')
    }
    const result = await adapters.productionMockSeeder.seed(identity)
    await loadFarmAccess(identity)
    return result
  }, [adapters.productionMockSeeder, identity, loadFarmAccess])

  const applyFarmSwitch = useCallback((farm: FarmAccess) => {
    setCurrentFarmId(farm.farmId)
    sessionStorage.setItem('kdoms.currentFarmId', farm.farmId)
  }, [])

  const requestFarmSwitch = useCallback(
    (farmId: string) => {
      const target = farms.find((farm) => farm.farmId === farmId)
      if (!target || target.farmId === currentFarmId) return
      const hasPendingInCurrentFarm = pendingOperations.some(
        (operation) => operation.farmId === currentFarmId,
      )
      if (hasPendingInCurrentFarm) {
        setPendingSwitchTarget(target)
        return
      }
      applyFarmSwitch(target)
    },
    [applyFarmSwitch, currentFarmId, farms, pendingOperations],
  )

  const confirmFarmSwitch = useCallback(() => {
    if (pendingSwitchTarget) applyFarmSwitch(pendingSwitchTarget)
    setPendingSwitchTarget(undefined)
  }, [applyFarmSwitch, pendingSwitchTarget])

  const cancelFarmSwitch = useCallback(() => setPendingSwitchTarget(undefined), [])

  const addDemoPendingOperation = useCallback(() => {
    if (!currentFarm) return
    setPendingOperations((current) => [
      ...current,
      {
        operationId: `pending_${crypto.randomUUID()}`,
        organizationId: currentFarm.organizationId,
        farmId: currentFarm.farmId,
        label: `รายการค้างส่งทดสอบ · ${currentFarm.farmCode}`,
      },
    ])
  }, [currentFarm])

  const clearDemoPendingOperations = useCallback(() => setPendingOperations([]), [])

  const requireFarmAndIdentity = useCallback(() => {
    if (!identity || !currentFarm) throw new Error('ยังไม่มีผู้ใช้หรือสวนปัจจุบัน')
    return { identity, currentFarm }
  }, [currentFarm, identity])

  const annualMutationContext = useCallback(() => {
    const context = requireFarmAndIdentity()
    return { actor: context.identity, farm: context.currentFarm }
  }, [requireFarmAndIdentity])

  const refreshAnnualCycles = useCallback(async () => {
    return loadAnnualCycles(annualCycleSnapshot.selectedCycle?.annualCycleId)
  }, [annualCycleSnapshot.selectedCycle?.annualCycleId, loadAnnualCycles])

  const createAnnualCycle = useCallback(async (
    idempotencyKey: string,
    draft: AnnualCycleDraft,
  ) => {
    const result = await adapters.annualCycleRepository.createCycle(
      annualMutationContext(), idempotencyKey, draft,
    )
    await loadAnnualCycles(result.annualCycleId)
    return result
  }, [adapters.annualCycleRepository, annualMutationContext, loadAnnualCycles])

  const updateAnnualCycle = useCallback(async (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ) => {
    const result = await adapters.annualCycleRepository.updateCycle(
      annualMutationContext(), annualCycleId, idempotencyKey, draft, reason,
    )
    await loadAnnualCycles(annualCycleId)
    return result
  }, [adapters.annualCycleRepository, annualMutationContext, loadAnnualCycles])

  const transitionAnnualCycle = useCallback(async (
    annualCycleId: string,
    idempotencyKey: string,
    nextStatus: AnnualCycleStatus,
    reason: string,
  ) => {
    const result = await adapters.annualCycleRepository.transitionCycle(
      annualMutationContext(), annualCycleId, idempotencyKey, nextStatus, reason,
    )
    await loadAnnualCycles(annualCycleId)
    return result
  }, [adapters.annualCycleRepository, annualMutationContext, loadAnnualCycles])

  const correctAnnualCycle = useCallback(async (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ) => {
    const result = await adapters.annualCycleRepository.correctCycle(
      annualMutationContext(), annualCycleId, idempotencyKey, draft, reason,
    )
    await loadAnnualCycles(annualCycleId)
    return result
  }, [adapters.annualCycleRepository, annualMutationContext, loadAnnualCycles])

  const createAnnualPlanItem = useCallback(async (
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualPlanItemDraft,
  ) => {
    const result = await adapters.annualCycleRepository.createPlanItem(
      annualMutationContext(), annualCycleId, idempotencyKey, draft,
    )
    await loadAnnualCycles(annualCycleId)
    return result
  }, [adapters.annualCycleRepository, annualMutationContext, loadAnnualCycles])

  const farmManagementContext = useCallback((): FarmManagementContext => {
    const context = requireFarmAndIdentity()
    return {
      actor: context.identity,
      organizationId: context.currentFarm.organizationId,
      organizationCode: context.currentFarm.organizationCode,
      isOrganizationOwner: context.currentFarm.isOrganizationOwner,
    }
  }, [requireFarmAndIdentity])

  const listFarmProfiles = useCallback(async () => {
    return adapters.repository.listFarmProfiles(farmManagementContext())
  }, [adapters.repository, farmManagementContext])

  const getFarmProfile = useCallback(async (farmId: string) => {
    return adapters.repository.getFarmProfile(farmManagementContext(), farmId)
  }, [adapters.repository, farmManagementContext])

  const createFarm = useCallback(async (
    idempotencyKey: string,
    draft: FarmProfileDraft,
  ) => {
    const context = farmManagementContext()
    const result = await adapters.repository.createFarm({
      context,
      idempotencyKey,
      draft,
    })
    await loadFarmAccess(context.actor)
    return result
  }, [adapters.repository, farmManagementContext, loadFarmAccess])

  const updateFarmProfile = useCallback(async (
    farmId: string,
    idempotencyKey: string,
    draft: FarmProfileDraft,
  ) => {
    const context = farmManagementContext()
    const result = await adapters.repository.updateFarmProfile({
      context,
      farmId,
      idempotencyKey,
      draft,
    })
    await loadFarmAccess(context.actor)
    return result
  }, [adapters.repository, farmManagementContext, loadFarmAccess])

  const getFarmArchiveReadiness = useCallback(async (farmId: string) => {
    const readiness = await adapters.repository.getFarmArchiveReadiness(
      farmManagementContext(),
      farmId,
    )
    const persistedIds = new Set(
      readiness.pendingOperations.map((operation) => operation.recordId),
    )
    const localPending = pendingOperations
      .filter(
        (operation) => operation.farmId === farmId && !persistedIds.has(operation.operationId),
      )
      .map((operation) => ({
        kind: 'PENDING_OPERATION' as const,
        recordId: operation.operationId,
        label: operation.label,
        status: 'PENDING_LOCAL',
      }))
    const pending = [...readiness.pendingOperations, ...localPending]
    return {
      ...readiness,
      pendingOperations: pending,
      canArchive: readiness.openWorkOrders.length === 0 && pending.length === 0,
    }
  }, [adapters.repository, farmManagementContext, pendingOperations])

  const changeFarmStatus = useCallback(async (
    farmId: string,
    idempotencyKey: string,
    nextStatus: FarmStatus,
  ) => {
    const context = farmManagementContext()
    const result = await adapters.repository.changeFarmStatus({
      context,
      farmId,
      idempotencyKey,
      nextStatus,
      knownPendingOperationIds: pendingOperations
        .filter((operation) => operation.farmId === farmId)
        .map((operation) => operation.operationId),
    })
    await loadFarmAccess(context.actor)
    return result
  }, [
    adapters.repository,
    farmManagementContext,
    loadFarmAccess,
    pendingOperations,
  ])

  const listFarmAudit = useCallback(async (farmId: string) => {
    return adapters.repository.listFarmAudit(farmManagementContext(), farmId)
  }, [adapters.repository, farmManagementContext])

  const listFarmMembers = useCallback(async () => {
    const context = requireFarmAndIdentity()
    return adapters.repository.listFarmMembers(
      context.currentFarm.organizationId,
      context.currentFarm.farmId,
    )
  }, [adapters.repository, requireFarmAndIdentity])

  const changeFarmMembership = useCallback(
    async (
      input: Omit<MembershipChangeInput, 'actor' | 'organizationId' | 'farmId'>,
    ) => {
      const context = requireFarmAndIdentity()
      const event = await adapters.repository.changeFarmMembership({
        ...input,
        actor: context.identity,
        organizationId: context.currentFarm.organizationId,
        farmId: context.currentFarm.farmId,
      })
      await loadFarmAccess(context.identity)
      return event
    },
    [adapters.repository, loadFarmAccess, requireFarmAndIdentity],
  )

  const listMembershipAudit = useCallback(async () => {
    const context = requireFarmAndIdentity()
    return adapters.repository.listMembershipAudit(
      context.currentFarm.organizationId,
      context.currentFarm.farmId,
    )
  }, [adapters.repository, requireFarmAndIdentity])

  const listTreePositions = useCallback(async () => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.listTreePositions(
      context.currentFarm.organizationId,
      context.currentFarm.farmId,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const getTreePosition = useCallback(async (positionId: string) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.getTreePosition(
      context.currentFarm.organizationId,
      context.currentFarm.farmId,
      positionId,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const resolvePositionRoute = useCallback(async (positionId: string) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.resolvePositionRoute(
      { actor: context.identity, farm: context.currentFarm },
      positionId,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const resolveTag = useCallback(async (tagCode: string) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.resolveTag(
      context.currentFarm.organizationId,
      context.currentFarm.farmId,
      tagCode,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const createTreePosition = useCallback(async (draft: TreePositionDraft) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.createTreePosition(
      { actor: context.identity, farm: context.currentFarm },
      draft,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const updateCurrentPlantingCycle = useCallback(async (
    positionId: string,
    input: UpdatePlantingCycleInput,
  ) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.updateCurrentPlantingCycle(
      { actor: context.identity, farm: context.currentFarm },
      positionId,
      input,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const replacePlantingCycle = useCallback(async (
    positionId: string,
    input: ReplacePlantingCycleInput,
  ) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.replacePlantingCycle(
      { actor: context.identity, farm: context.currentFarm },
      positionId,
      input,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const archiveTreePosition = useCallback(async (
    positionId: string,
    reason: string,
  ) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.archiveTreePosition(
      { actor: context.identity, farm: context.currentFarm },
      positionId,
      reason,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const reportDamagedTag = useCallback(async (positionId: string, note: string) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.reportDamagedTag(
      { actor: context.identity, farm: context.currentFarm },
      positionId,
      note,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const importTreePositions = useCallback(async (
    idempotencyKey: string,
    candidates: readonly TreeImportCandidate[],
  ) => {
    const context = requireFarmAndIdentity()
    return adapters.treeRepository.importTreePositions(
      { actor: context.identity, farm: context.currentFarm },
      idempotencyKey,
      candidates,
    )
  }, [adapters.treeRepository, requireFarmAndIdentity])

  const workContext = useCallback(() => {
    const context = requireFarmAndIdentity()
    return { actor: context.identity, farm: context.currentFarm }
  }, [requireFarmAndIdentity])

  const listWorkOrders = useCallback(async () => {
    return adapters.workRepository.listWorkOrders(workContext())
  }, [adapters.workRepository, workContext])

  const getWorkOrder = useCallback(async (workOrderId: string) => {
    return adapters.workRepository.getWorkOrder(workContext(), workOrderId)
  }, [adapters.workRepository, workContext])

  const createWorkOrder = useCallback(async (
    idempotencyKey: string,
    draft: WorkOrderDraft,
  ) => {
    return adapters.workRepository.createWorkOrder(workContext(), idempotencyKey, draft)
  }, [adapters.workRepository, workContext])

  const performWorkAction = useCallback(async (
    workOrderId: string,
    idempotencyKey: string,
    action: WorkAction,
  ) => {
    return adapters.workRepository.performWorkAction(
      workContext(), workOrderId, idempotencyKey, action,
    )
  }, [adapters.workRepository, workContext])

  const confirmWorkTarget = useCallback(async (
    workOrderId: string,
    idempotencyKey: string,
    scannedPositionId: string,
  ) => {
    return adapters.workRepository.confirmWorkTarget(
      workContext(), workOrderId, idempotencyKey, scannedPositionId,
    )
  }, [adapters.workRepository, workContext])

  const uploadWorkPhoto = useCallback(async (
    workOrderId: string,
    photoId: string,
    phase: WorkPhotoEvidence['phase'],
    file: Blob,
  ) => {
    const { prepareWorkPhotoForUpload } = await import('../services/workPhotoProcessing')
    const prepared = await prepareWorkPhotoForUpload(file, {
      allowSimulatedTestFallback: adapters.mode === 'mock',
      decode: adapters.mode === 'mock'
        ? () => Promise.reject(new Error('SIMULATED/TEST ONLY — browser image decoder bypassed'))
        : undefined,
    })
    return adapters.workRepository.uploadWorkPhoto(
      workContext(), workOrderId, photoId, phase, prepared,
    )
  }, [adapters.mode, adapters.workRepository, workContext])

  const saveWorkInstructionPhotos = useCallback(async (
    workOrderId: string,
    idempotencyKey: string,
    photos: readonly WorkPhotoEvidence[],
  ) => {
    return adapters.workRepository.saveWorkInstructionPhotos(
      workContext(), workOrderId, idempotencyKey, photos,
    )
  }, [adapters.workRepository, workContext])

  const getWorkPhotoUrl = useCallback(async (
    workOrderId: string,
    storagePath: string,
  ) => {
    return adapters.workRepository.getWorkPhotoUrl(workContext(), workOrderId, storagePath)
  }, [adapters.workRepository, workContext])

  const saveWorkReport = useCallback(async (
    workOrderId: string,
    idempotencyKey: string,
    report: WorkReportInput,
  ) => {
    return adapters.workRepository.saveWorkReport(
      workContext(), workOrderId, idempotencyKey, report,
    )
  }, [adapters.workRepository, workContext])

  const listCareEvents = useCallback(async () => {
    return adapters.workRepository.listCareEvents(workContext())
  }, [adapters.workRepository, workContext])

  const approveCareEvent = useCallback(async (
    careEventId: string,
    idempotencyKey: string,
  ) => {
    return adapters.workRepository.approveCareEvent(
      workContext(), careEventId, idempotencyKey,
    )
  }, [adapters.workRepository, workContext])

  const listDiseaseIncidents = useCallback(async () => {
    return adapters.workRepository.listDiseaseIncidents(workContext())
  }, [adapters.workRepository, workContext])

  const createDiseaseIncident = useCallback(async (
    idempotencyKey: string,
    draft: DiseaseIncidentDraft,
  ) => {
    return adapters.workRepository.createDiseaseIncident(
      workContext(), idempotencyKey, draft,
    )
  }, [adapters.workRepository, workContext])

  const assessDiseaseIncident = useCallback(async (
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseAssessmentInput,
  ) => {
    return adapters.workRepository.assessDiseaseIncident(
      workContext(), incidentId, idempotencyKey, input,
    )
  }, [adapters.workRepository, workContext])

  const followUpDiseaseIncident = useCallback(async (
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseFollowUpInput,
  ) => {
    return adapters.workRepository.followUpDiseaseIncident(
      workContext(), incidentId, idempotencyKey, input,
    )
  }, [adapters.workRepository, workContext])

  const addDiseasePhotoMock = useCallback(async (
    incidentId: string,
    idempotencyKey: string,
    draft: DiseasePhotoMockDraft,
  ) => {
    return adapters.workRepository.addDiseasePhotoMock(
      workContext(), incidentId, idempotencyKey, draft,
    )
  }, [adapters.workRepository, workContext])

  const advanceDiseasePhotoMock = useCallback(async (
    incidentId: string,
    photoId: string,
    idempotencyKey: string,
    action: DiseasePhotoAction,
  ) => {
    return adapters.workRepository.advanceDiseasePhotoMock(
      workContext(), incidentId, photoId, idempotencyKey, action,
    )
  }, [adapters.workRepository, workContext])

  const createTreatmentWorkOrder = useCallback(async (
    incidentId: string,
    idempotencyKey: string,
    input: TreatmentWorkOrderInput,
  ) => {
    return adapters.workRepository.createTreatmentWorkOrder(
      workContext(), incidentId, idempotencyKey, input,
    )
  }, [adapters.workRepository, workContext])

  const listNotifications = useCallback(async () => {
    return adapters.workRepository.listNotifications(workContext())
  }, [adapters.workRepository, workContext])

  const listDiseaseAnalysisSessions = useCallback(async () => {
    return adapters.diseaseAnalysisRepository.listDiseaseAnalysisSessions(workContext())
  }, [adapters.diseaseAnalysisRepository, workContext])

  const createDiseaseAnalysisSession = useCallback(async (
    idempotencyKey: string,
    draft: DiseaseAnalysisDraft,
  ) => {
    return adapters.diseaseAnalysisRepository.createDiseaseAnalysisSession(
      workContext(), idempotencyKey, draft,
    )
  }, [adapters.diseaseAnalysisRepository, workContext])

  const reviewDiseaseAnalysisSession = useCallback(async (
    analysisSessionId: string,
    idempotencyKey: string,
    input: DiseaseAnalysisReviewInput,
  ) => {
    return adapters.diseaseAnalysisRepository.reviewDiseaseAnalysisSession(
      workContext(), analysisSessionId, idempotencyKey, input,
    )
  }, [adapters.diseaseAnalysisRepository, workContext])

  const listCommercialSnapshot = useCallback(async () => {
    return adapters.commercialRepository.listSnapshot(workContext())
  }, [adapters.commercialRepository, workContext])

  const createCropCycle = useCallback(async (
    idempotencyKey: string,
    draft: CropCycleDraft,
  ) => adapters.commercialRepository.createCropCycle(
    workContext(), idempotencyKey, draft,
  ), [adapters.commercialRepository, workContext])

  const advanceCropCycleStage = useCallback(async (
    cropCycleId: string,
    idempotencyKey: string,
    nextStage: CropStage,
  ) => adapters.commercialRepository.advanceCropCycleStage(
    workContext(), cropCycleId, idempotencyKey, nextStage,
  ), [adapters.commercialRepository, workContext])

  const createFruitObservation = useCallback(async (
    idempotencyKey: string,
    draft: FruitObservationDraft,
  ) => adapters.commercialRepository.createFruitObservation(
    workContext(), idempotencyKey, draft,
  ), [adapters.commercialRepository, workContext])

  const archiveFruitObservation = useCallback(async (
    observationId: string,
    idempotencyKey: string,
    reason: string,
  ) => adapters.commercialRepository.archiveFruitObservation(
    workContext(), observationId, idempotencyKey, reason,
  ), [adapters.commercialRepository, workContext])

  const createHarvestLot = useCallback(async (
    idempotencyKey: string,
    draft: HarvestLotDraft,
  ) => adapters.commercialRepository.createHarvestLot(
    workContext(), idempotencyKey, draft,
  ), [adapters.commercialRepository, workContext])

  const createSalesLot = useCallback(async (
    idempotencyKey: string,
    draft: SalesLotDraft,
  ) => adapters.commercialRepository.createSalesLot(
    workContext(), idempotencyKey, draft,
  ), [adapters.commercialRepository, workContext])

  const correctSalesLot = useCallback(async (
    salesLotId: string,
    idempotencyKey: string,
    input: SalesCorrectionInput,
  ) => adapters.commercialRepository.correctSalesLot(
    workContext(), salesLotId, idempotencyKey, input,
  ), [adapters.commercialRepository, workContext])

  const archiveSalesLot = useCallback(async (
    salesLotId: string,
    idempotencyKey: string,
    reason: string,
  ) => adapters.commercialRepository.archiveSalesLot(
    workContext(), salesLotId, idempotencyKey, reason,
  ), [adapters.commercialRepository, workContext])

  const recordInventoryMovement = useCallback(async (
    idempotencyKey: string,
    input: InventoryMovementInput,
  ) => adapters.commercialRepository.recordInventoryMovement(
    workContext(), idempotencyKey, input,
  ), [adapters.commercialRepository, workContext])

  const listCommercialAudit = useCallback(async () => {
    return adapters.commercialRepository.listCommercialAudit(workContext())
  }, [adapters.commercialRepository, workContext])

  const resetPhase5MockData = useCallback(async () => {
    if (!adapters.commercialRepository.resetMockPack) {
      throw new Error('Reset นี้ใช้ได้เฉพาะ Mock Data Pack')
    }
    await adapters.commercialRepository.resetMockPack()
  }, [adapters.commercialRepository])

  const selectedManagementCycle = useCallback(() => {
    const selected = annualCycleSnapshot.selectedCycle
    if (!selected) throw new Error('กรุณาเลือกรอบบริหารสวนรายปีก่อนบันทึกต้นทุนหรือสร้างรายงาน')
    return selected
  }, [annualCycleSnapshot.selectedCycle])

  const listManagementCostSnapshot = useCallback(async () => {
    const cycle = selectedManagementCycle()
    return adapters.managementReportingRepository.listSnapshot(
      workContext(),
      cycle.annualCycleId,
    )
  }, [adapters.managementReportingRepository, selectedManagementCycle, workContext])

  const createLaborCost = useCallback(async (
    idempotencyKey: string,
    draft: LaborCostDraft,
  ) => adapters.managementReportingRepository.createLaborCost(
    workContext(),
    selectedManagementCycle(),
    idempotencyKey,
    draft,
  ), [adapters.managementReportingRepository, selectedManagementCycle, workContext])

  const createOperatingExpense = useCallback(async (
    idempotencyKey: string,
    draft: OperatingExpenseDraft,
  ) => adapters.managementReportingRepository.createOperatingExpense(
    workContext(),
    selectedManagementCycle(),
    idempotencyKey,
    draft,
  ), [adapters.managementReportingRepository, selectedManagementCycle, workContext])

  const generateManagementReport = useCallback(async (
    kind: ReportPeriodKind,
    anchorDate: string,
  ) => {
    const cycle = selectedManagementCycle()
    const context = workContext()
    const [workOrders, diseaseIncidents, commercial, costs] = await Promise.all([
      adapters.workRepository.listWorkOrders(context),
      adapters.workRepository.listDiseaseIncidents(context),
      adapters.commercialRepository.listSnapshot(context),
      adapters.managementReportingRepository.listSnapshot(context, cycle.annualCycleId),
    ])
    return buildFarmManagementReport({
      context,
      kind,
      anchorDate,
      annualCycle: cycle,
      annualPlanItems: annualCycleSnapshot.planItems,
      workOrders,
      diseaseIncidents,
      commercial,
      costs,
    })
  }, [
    adapters.commercialRepository,
    adapters.managementReportingRepository,
    adapters.workRepository,
    annualCycleSnapshot.planItems,
    selectedManagementCycle,
    workContext,
  ])

  const resetManagementReportingMockData = useCallback(async () => {
    if (!adapters.managementReportingRepository.resetMockPack) {
      throw new Error('Reset นี้ใช้ได้เฉพาะ Management Reporting Mock Data Pack')
    }
    await adapters.managementReportingRepository.resetMockPack()
  }, [adapters.managementReportingRepository])

  const operationalContext = useCallback(() => {
    const context = requireFarmAndIdentity()
    return { actor: context.identity, farm: context.currentFarm }
  }, [requireFarmAndIdentity])

  const getFarmDashboard = useCallback(async () => {
    return adapters.operationalRepository.getFarmDashboard(operationalContext())
  }, [adapters.operationalRepository, operationalContext])

  const getPortfolioDashboard = useCallback(async () => {
    if (!identity) throw new Error('ยังไม่มีผู้ใช้')
    return adapters.operationalRepository.getPortfolioDashboard(identity, farms)
  }, [adapters.operationalRepository, farms, identity])

  const listOfflineOperations = useCallback(async () => {
    return adapters.operationalRepository.listOfflineOperations(operationalContext())
  }, [adapters.operationalRepository, operationalContext])

  const queueOfflineOperation = useCallback(async (
    idempotencyKey: string,
    input: QueueOperationInput,
  ) => {
    const record = await adapters.operationalRepository.queueOfflineOperation(
      operationalContext(), idempotencyKey, input,
    )
    setPendingOperations((current) => current.some((item) => item.operationId === record.operationId)
      ? current
      : [...current, record])
    return record
  }, [adapters.operationalRepository, operationalContext])

  const syncOfflineOperation = useCallback(async (operationId: string) => {
    const record = await adapters.operationalRepository.syncOfflineOperation(
      operationalContext(), operationId,
    )
    setPendingOperations((current) => record.status === 'SYNCED'
      ? current.filter((item) => item.operationId !== record.operationId)
      : current.map((item) => item.operationId === record.operationId ? record : item))
    return record
  }, [adapters.operationalRepository, operationalContext])

  const listMasterConflicts = useCallback(async () => {
    return adapters.operationalRepository.listMasterConflicts(operationalContext())
  }, [adapters.operationalRepository, operationalContext])

  const resolveMasterConflict = useCallback(async (
    conflictId: string,
    idempotencyKey: string,
    resolution: ConflictResolution,
    reason: string,
  ) => adapters.operationalRepository.resolveMasterConflict(
    operationalContext(), conflictId, idempotencyKey, resolution, reason,
  ), [adapters.operationalRepository, operationalContext])

  const listPhotoRecoveries = useCallback(async () => {
    return adapters.operationalRepository.listPhotoRecoveries(operationalContext())
  }, [adapters.operationalRepository, operationalContext])

  const registerPhotoRecovery = useCallback(async (
    idempotencyKey: string,
    draft: PhotoRecoveryDraft,
  ) => adapters.operationalRepository.registerPhotoRecovery(
    operationalContext(), idempotencyKey, draft,
  ), [adapters.operationalRepository, operationalContext])

  const retryPhotoRecovery = useCallback(async (
    recoveryId: string,
    idempotencyKey: string,
  ) => adapters.operationalRepository.retryPhotoRecovery(
    operationalContext(), recoveryId, idempotencyKey,
  ), [adapters.operationalRepository, operationalContext])

  const binaryQueueScope = useCallback((): WorkPhotoBinaryQueueScope => {
    const context = requireFarmAndIdentity()
    return {
      organizationId: context.currentFarm.organizationId,
      farmId: context.currentFarm.farmId,
      actorUserId: context.identity.userId,
    }
  }, [requireFarmAndIdentity])

  const queueWorkPhotoBinaryBatch = useCallback(async (
    input: QueueWorkPhotoBinaryBatchInput,
  ) => {
    const context = requireFarmAndIdentity()
    const { createWorkPhotoBinaryBatch, workPhotoBinaryQueue } = await import(
      '../services/workPhotoBinaryQueue'
    )
    const batch = createWorkPhotoBinaryBatch({
      ...input,
      farm: context.currentFarm,
      actorUserId: context.identity.userId,
      exampleData: true,
    })
    await workPhotoBinaryQueue.put(batch)
    return batch
  }, [requireFarmAndIdentity])

  const checkpointQueuedWorkPhoto = useCallback(async (
    batchId: string,
    evidence: WorkPhotoEvidence,
  ) => {
    const { workPhotoBinaryQueue } = await import('../services/workPhotoBinaryQueue')
    await workPhotoBinaryQueue.checkpointUploaded(batchId, binaryQueueScope(), evidence)
  }, [binaryQueueScope])

  const removeQueuedWorkPhotoBatch = useCallback(async (batchId: string) => {
    const { workPhotoBinaryQueue } = await import('../services/workPhotoBinaryQueue')
    await workPhotoBinaryQueue.delete(batchId, binaryQueueScope())
  }, [binaryQueueScope])

  const listQueuedWorkPhotoBatches = useCallback(async () => {
    const { workPhotoBinaryQueue } = await import('../services/workPhotoBinaryQueue')
    return workPhotoBinaryQueue.list(binaryQueueScope())
  }, [binaryQueueScope])

  const retryQueuedWorkPhotoBatch = useCallback(async (batchId: string) => {
    const context = requireFarmAndIdentity()
    const scope = binaryQueueScope()
    const [{ workPhotoBinaryQueue }, { uploadAndCommitWorkPhotoBatch }] = await Promise.all([
      import('../services/workPhotoBinaryQueue'),
      import('../services/workPhotoRecovery'),
    ])
    const batch = await workPhotoBinaryQueue.get(batchId, scope)
    if (!batch) throw new Error('ไม่พบ Durable Photo Queue หรือรายการหมดอายุแล้ว')
    const result = await uploadAndCommitWorkPhotoBatch({
      mode: adapters.mode,
      farm: context.currentFarm,
      workOrderId: batch.workOrderId,
      candidates: batch.candidates,
      upload: (candidate) => uploadWorkPhoto(
        batch.workOrderId, candidate.photoId, candidate.phase, candidate.file,
      ),
      commit: (photos) => batch.kind === 'INSTRUCTION'
        ? saveWorkInstructionPhotos(batch.workOrderId, batch.commitIdempotencyKey, photos)
        : saveWorkReport(batch.workOrderId, batch.commitIdempotencyKey, {
          ...batch.reportDraft!, photos,
        }),
      register: registerPhotoRecovery,
      onPhotoUploaded: (_candidate, evidence) =>
        workPhotoBinaryQueue.checkpointUploaded(batch.batchId, scope, evidence),
    })

    const photoIds = new Set(batch.candidates.map((candidate) => candidate.photoId))
    const recoveries = await adapters.operationalRepository.listPhotoRecoveries(operationalContext())
    const unresolved = recoveries.filter((recovery) =>
      recovery.workOrderId === batch.workOrderId &&
      photoIds.has(recovery.photoId) &&
      ['FAILED', 'PENDING', 'ORPHANED'].includes(recovery.status),
    )
    for (const recovery of unresolved) {
      await adapters.operationalRepository.retryPhotoRecovery(
        operationalContext(),
        recovery.recoveryId,
        `queue-linked-${batch.batchId}-${recovery.photoId}`,
      )
    }
    await workPhotoBinaryQueue.delete(batch.batchId, scope)
    return result
  }, [
    adapters.mode,
    adapters.operationalRepository,
    binaryQueueScope,
    operationalContext,
    registerPhotoRecovery,
    requireFarmAndIdentity,
    saveWorkInstructionPhotos,
    saveWorkReport,
    uploadWorkPhoto,
  ])

  const cleanupOrphanPhoto = useCallback(async (
    recoveryId: string,
    idempotencyKey: string,
    reason: string,
  ) => adapters.operationalRepository.cleanupOrphanPhoto(
    operationalContext(), recoveryId, idempotencyKey, reason,
  ), [adapters.operationalRepository, operationalContext])

  const listOperationalAudit = useCallback(async () => {
    return adapters.operationalRepository.listOperationalAudit(operationalContext())
  }, [adapters.operationalRepository, operationalContext])

  const requestFarmExport = useCallback(async (idempotencyKey: string) => {
    return adapters.operationalRepository.requestFarmExport(operationalContext(), idempotencyKey)
  }, [adapters.operationalRepository, operationalContext])

  const resetPhase6MockData = useCallback(async () => {
    if (!adapters.operationalRepository.resetMockPack) {
      throw new Error('Reset นี้ใช้ได้เฉพาะ Phase 6 Mock Data Pack')
    }
    await adapters.operationalRepository.resetMockPack()
    const { workPhotoBinaryQueue } = await import('../services/workPhotoBinaryQueue')
    await workPhotoBinaryQueue.clearScope(binaryQueueScope())
    setPendingOperations([])
  }, [adapters.operationalRepository, binaryQueueScope])

  const value = useMemo<Phase2ContextValue>(
    () => ({
      mode: adapters.mode,
      authMode: adapters.authMode,
      developmentAdminSignInAvailable: import.meta.env.DEV,
      identity,
      farms,
      currentFarm,
      farmsLoading,
      authError,
      otpChallenge,
      pendingOperations,
      pendingSwitchTarget,
      annualCycleSnapshot,
      annualCyclesLoading,
      selectAnnualCycle,
      refreshAnnualCycles,
      createAnnualCycle,
      updateAnnualCycle,
      transitionAnnualCycle,
      correctAnnualCycle,
      createAnnualPlanItem,
      listManagementCostSnapshot,
      createLaborCost,
      createOperatingExpense,
      generateManagementReport,
      resetManagementReportingMockData,
      requestOtp,
      verifyOtp,
      cancelOtp,
      signInAsDevelopmentAdmin,
      signInWithMockAccount,
      seedProductionMockData,
      signOut,
      requestFarmSwitch,
      confirmFarmSwitch,
      cancelFarmSwitch,
      addDemoPendingOperation,
      clearDemoPendingOperations,
      listFarmProfiles,
      getFarmProfile,
      createFarm,
      updateFarmProfile,
      getFarmArchiveReadiness,
      changeFarmStatus,
      listFarmAudit,
      listFarmMembers,
      changeFarmMembership,
      listMembershipAudit,
      listTreePositions,
      getTreePosition,
      resolvePositionRoute,
      resolveTag,
      createTreePosition,
      updateCurrentPlantingCycle,
      replacePlantingCycle,
      archiveTreePosition,
      reportDamagedTag,
      importTreePositions,
      listWorkOrders,
      getWorkOrder,
      createWorkOrder,
      performWorkAction,
      confirmWorkTarget,
      uploadWorkPhoto,
      saveWorkInstructionPhotos,
      getWorkPhotoUrl,
      saveWorkReport,
      listCareEvents,
      approveCareEvent,
      listDiseaseIncidents,
      createDiseaseIncident,
      assessDiseaseIncident,
      followUpDiseaseIncident,
      addDiseasePhotoMock,
      advanceDiseasePhotoMock,
      createTreatmentWorkOrder,
      listNotifications,
      listDiseaseAnalysisSessions,
      createDiseaseAnalysisSession,
      reviewDiseaseAnalysisSession,
      listCommercialSnapshot,
      createCropCycle,
      advanceCropCycleStage,
      createFruitObservation,
      archiveFruitObservation,
      createHarvestLot,
      createSalesLot,
      correctSalesLot,
      archiveSalesLot,
      recordInventoryMovement,
      listCommercialAudit,
      resetPhase5MockData,
      getFarmDashboard,
      getPortfolioDashboard,
      listOfflineOperations,
      queueOfflineOperation,
      syncOfflineOperation,
      listMasterConflicts,
      resolveMasterConflict,
      listPhotoRecoveries,
      registerPhotoRecovery,
      retryPhotoRecovery,
      queueWorkPhotoBinaryBatch,
      checkpointQueuedWorkPhoto,
      removeQueuedWorkPhotoBatch,
      listQueuedWorkPhotoBatches,
      retryQueuedWorkPhotoBatch,
      cleanupOrphanPhoto,
      listOperationalAudit,
      requestFarmExport,
      resetPhase6MockData,
    }),
    [
      adapters.mode,
      adapters.authMode,
      addDemoPendingOperation,
      authError,
      cancelFarmSwitch,
      cancelOtp,
      changeFarmMembership,
      changeFarmStatus,
      clearDemoPendingOperations,
      confirmFarmSwitch,
      createFarm,
      currentFarm,
      farms,
      farmsLoading,
      getFarmArchiveReadiness,
      getFarmProfile,
      identity,
      listFarmAudit,
      listFarmMembers,
      listFarmProfiles,
      listMembershipAudit,
      listTreePositions,
      getTreePosition,
      resolvePositionRoute,
      resolveTag,
      createTreePosition,
      updateCurrentPlantingCycle,
      replacePlantingCycle,
      archiveTreePosition,
      reportDamagedTag,
      importTreePositions,
      listWorkOrders,
      getWorkOrder,
      createWorkOrder,
      performWorkAction,
      confirmWorkTarget,
      uploadWorkPhoto,
      saveWorkInstructionPhotos,
      getWorkPhotoUrl,
      saveWorkReport,
      listCareEvents,
      approveCareEvent,
      listDiseaseIncidents,
      createDiseaseIncident,
      assessDiseaseIncident,
      followUpDiseaseIncident,
      addDiseasePhotoMock,
      advanceDiseasePhotoMock,
      createTreatmentWorkOrder,
      listNotifications,
      listDiseaseAnalysisSessions,
      createDiseaseAnalysisSession,
      reviewDiseaseAnalysisSession,
      listCommercialSnapshot,
      createCropCycle,
      advanceCropCycleStage,
      createFruitObservation,
      archiveFruitObservation,
      createHarvestLot,
      createSalesLot,
      correctSalesLot,
      archiveSalesLot,
      recordInventoryMovement,
      listCommercialAudit,
      resetPhase5MockData,
      getFarmDashboard,
      getPortfolioDashboard,
      listOfflineOperations,
      queueOfflineOperation,
      syncOfflineOperation,
      listMasterConflicts,
      resolveMasterConflict,
      listPhotoRecoveries,
      registerPhotoRecovery,
      retryPhotoRecovery,
      queueWorkPhotoBinaryBatch,
      checkpointQueuedWorkPhoto,
      removeQueuedWorkPhotoBatch,
      listQueuedWorkPhotoBatches,
      retryQueuedWorkPhotoBatch,
      cleanupOrphanPhoto,
      listOperationalAudit,
      requestFarmExport,
      resetPhase6MockData,
      otpChallenge,
      pendingOperations,
      pendingSwitchTarget,
      annualCycleSnapshot,
      annualCyclesLoading,
      selectAnnualCycle,
      refreshAnnualCycles,
      createAnnualCycle,
      updateAnnualCycle,
      transitionAnnualCycle,
      correctAnnualCycle,
      createAnnualPlanItem,
      listManagementCostSnapshot,
      createLaborCost,
      createOperatingExpense,
      generateManagementReport,
      resetManagementReportingMockData,
      requestFarmSwitch,
      requestOtp,
      seedProductionMockData,
      signInAsDevelopmentAdmin,
      signInWithMockAccount,
      signOut,
      updateFarmProfile,
      verifyOtp,
    ],
  )

  return (
    <Phase2Context.Provider value={value}>
      {children ?? <Outlet />}
    </Phase2Context.Provider>
  )
}

export function Phase2Provider({ children }: { children?: ReactNode }) {
  const [adapters, setAdapters] = useState<Phase6Adapters>()
  const [adapterError, setAdapterError] = useState<string>()

  const activateDevelopmentAdmin = useCallback(async () => {
    if (!import.meta.env.DEV) {
      throw new Error('ปุ่มผู้ดูแลแบบไม่ใช้ OTP เปิดได้เฉพาะเครื่องพัฒนา')
    }

    const [{ createMockPhase2Adapters }, { developmentAdminAccount }] =
      await Promise.all([
        import('../adapters/mock/mockFoundationAdapters'),
        import('../demo/demoAccounts'),
      ])
    if (!developmentAdminAccount) {
      throw new Error('ไม่พบบัญชีผู้ดูแลในชุดข้อมูลจำลอง')
    }

    const developmentAdapters = createMockPhase2Adapters()
    const challenge = await developmentAdapters.auth.requestOtp(
      developmentAdminAccount.phoneNumber,
      'firebase-recaptcha-container',
    )
    const identity = await developmentAdapters.auth.verifyOtp(
      challenge,
      developmentAdminAccount.otp,
    )
    const farmAccess = await developmentAdapters.repository.listFarmAccess(
      identity.userId,
    )
    const hasMaximumMockAccess = farmAccess.some(
      (farm) =>
        farm.farmStatus === 'ACTIVE' &&
        farm.role === 'ORG_OWNER' &&
        farm.isOrganizationOwner,
    )
    if (!hasMaximumMockAccess) {
      throw new Error('บัญชีผู้ดูแลจำลองไม่มีสิทธิ์ ORG_OWNER ในสวนที่ใช้งาน')
    }

    setAdapterError(undefined)
    setAdapters(developmentAdapters)
  }, [])

  useEffect(() => {
    let active = true
    void createRuntimeAdapters()
      .then((loadedAdapters) => {
        if (active) setAdapters(loadedAdapters)
      })
      .catch((error: unknown) => {
        if (active) setAdapterError(readableError(error))
      })
    return () => {
      active = false
    }
  }, [])

  if (adapterError) {
    return (
      <main className="runtime-loading" role="alert">
        <strong>เชื่อมต่อ Smart Durian Farm ไม่สำเร็จ</strong>
        <span>{adapterError}</span>
        <button className="primary-action" onClick={() => window.location.reload()} type="button">
          โหลดใหม่
        </button>
      </main>
    )
  }
  if (!adapters) {
    return (
      <main className="runtime-loading" aria-live="polite">
        <strong>กำลังเชื่อม Firebase และตรวจการตั้งค่า</strong>
        <span>หน้าจอนี้จะแสดงข้อผิดพลาดพร้อมวิธีลองใหม่แทนการแสดงจอขาว</span>
      </main>
    )
  }

  return (
    <ResolvedPhase2Provider
      activateDevelopmentAdmin={activateDevelopmentAdmin}
      adapters={adapters}
    >
      {children}
    </ResolvedPhase2Provider>
  )
}
