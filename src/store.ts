import { create } from "zustand";
import {
  Transaction,
  User,
  Category,
  TransactionType,
  DiaryEntry,
  ScheduleEntry,
  FixedExpense,
  Comment,
  AssetSurvey,
  AssetAnalysis,
  CounselingRecord,
  LifeRoutine,
  RoutineStatus,
  PsychologicalReport,
  RelationshipReport,
  SupportMessage,
  Notice,
} from "../types";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";

interface AppState {
  currentUser: User | null;
  users: User[];
  communityId: string | null;
  transactions: Transaction[];
  diaries: DiaryEntry[];
  schedules: ScheduleEntry[];
  fixedExpenses: FixedExpense[];
  categories: Category[];
  assetSurvey: AssetSurvey;
  assetAnalysis: AssetAnalysis | null;
  counselingRecords: CounselingRecord[];
  lifeRoutines: LifeRoutine[];
  psychologicalReports: PsychologicalReport[];
  relationshipReports: RelationshipReport[];
  supportMessages: SupportMessage[];
  notices: Notice[];

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCommunityId: (id: string | null) => void;
  setUsers: (users: User[]) => void;
  setAssetSurvey: (survey: Partial<AssetSurvey>) => void;
  setAssetAnalysis: (analysis: AssetAnalysis | null) => void;
  resetAssetSurvey: () => void;

  // Firestore Sync
  syncData: (communityId: string) => () => void;

  // Data Mutators
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addDiary: (diary: Omit<DiaryEntry, "id">) => Promise<void>;
  updateDiary: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteDiary: (id: string) => Promise<void>;

  addSchedule: (schedule: Omit<ScheduleEntry, "id">) => Promise<void>;
  updateSchedule: (
    id: string,
    updates: Partial<ScheduleEntry>,
  ) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  addFixedExpense: (expense: Omit<FixedExpense, "id">) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  addCounselingRecord: (record: Omit<CounselingRecord, "id">) => Promise<void>;
  deleteCounselingRecord: (id: string) => Promise<void>;
  importData: (data: any) => Promise<void>;

  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  resetAllData: () => Promise<void>;
  setCategories: (categories: Category[]) => Promise<void>;

  addLifeRoutine: (routine: Omit<LifeRoutine, "id">) => Promise<void>;
  updateLifeRoutine: (id: string, updates: Partial<LifeRoutine>) => Promise<void>;
  toggleRoutineTask: (routineId: string, dayIndex: number, taskId: string) => Promise<void>;

  addPsychologicalReport: (report: Omit<PsychologicalReport, "id">) => Promise<void>;
  deletePsychologicalReport: (id: string) => Promise<void>;

  addRelationshipReport: (report: Omit<RelationshipReport, "id">) => Promise<void>;
  deleteRelationshipReport: (id: string) => Promise<void>;

  addSupportMessage: (message: Omit<SupportMessage, "id">) => Promise<void>;
  updateSupportMessage: (id: string, updates: Partial<SupportMessage>) => Promise<void>;

  importData: (data: any) => Promise<void>;

  addNotice: (notice: Omit<Notice, "id">) => Promise<void>;
  updateNotice: (id: string, updates: Partial<Notice>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  toggleNoticeLike: (noticeId: string, userId: string) => Promise<void>;
  addNoticeComment: (noticeId: string, comment: Omit<Comment, "id">) => Promise<void>;
  incrementNoticeViewCount: (noticeId: string) => Promise<void>;

  // Social Actions
  toggleTransactionLike: (
    transactionId: string,
    userId: string,
  ) => Promise<void>;
  addTransactionComment: (
    transactionId: string,
    comment: Omit<Comment, "id">,
  ) => Promise<void>;
  toggleDiaryLike: (diaryId: string, userId: string) => Promise<void>;
  addDiaryComment: (
    diaryId: string,
    comment: Omit<Comment, "id">,
  ) => Promise<void>;
  addDiarySticker: (
    diaryId: string,
    userId: string,
    stickerType: any,
  ) => Promise<void>;
  updateDiarySticker: (
    diaryId: string,
    stickerId: string,
    updates: any,
  ) => Promise<void>;
  removeDiarySticker: (diaryId: string, stickerId: string) => Promise<void>;
}

const cleanHtmlEntities = (text: any): any => {
  if (typeof text !== 'string') return text;
  return text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  communityId: null,
  transactions: [],
  diaries: [],
  schedules: [],
  fixedExpenses: [],
  categories: [
    {
      id: "c1",
      name: "장보기",
      group: "식비",
      type: TransactionType.EXPENSE,
      budgetLimit: 500000,
      color: "#F9E2E6",
      iconId: "shopping",
    },
    {
      id: "c2",
      name: "외식",
      group: "식비",
      type: TransactionType.EXPENSE,
      budgetLimit: 300000,
      color: "#F7D1BA",
      iconId: "food",
    },
    {
      id: "c3",
      name: "카페/간식",
      group: "식비",
      type: TransactionType.EXPENSE,
      budgetLimit: 150000,
      color: "#FAF3DD",
      iconId: "cafe",
    },
    {
      id: "c7",
      name: "이동",
      group: "교통",
      type: TransactionType.EXPENSE,
      budgetLimit: 120000,
      color: "#E8E4F8",
      iconId: "transport",
    },
    {
      id: "i1",
      name: "월급",
      group: "수입",
      type: TransactionType.INCOME,
      budgetLimit: 0,
      color: "#E2F0EB",
      iconId: "salary",
    },
  ],
  assetSurvey: {
    step1: { savings: 0, stocks: 0, realEstate: 0, debt: 0 },
    step2: { irregularExpenses: 0 },
    step3: { riskTolerance: "MODERATE", experience: "", targetReturn: 5 },
    step4: { goal: "", targetAmount: 0, period: 12 },
    status: "IDLE",
  },
  assetAnalysis: null,
  counselingRecords: [],
  lifeRoutines: [],
  psychologicalReports: [],
  relationshipReports: [],
  supportMessages: [],
  notices: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  setCommunityId: (id) => {
    if (id) {
      // Save to history
      const historyItems = JSON.parse(localStorage.getItem('community_history') || '[]');
      if (!historyItems.includes(id)) {
        const newHistory = [id, ...historyItems].slice(0, 5);
        localStorage.setItem('community_history', JSON.stringify(newHistory));
      }
      localStorage.setItem('communityId', id);
    }
    set({ communityId: id });
  },
  setUsers: (users) => set({ users }),
  setAssetSurvey: (updates) =>
    set((state) => ({
      assetSurvey: { ...state.assetSurvey, ...updates },
    })),
  setAssetAnalysis: (analysis) => set({ assetAnalysis: analysis }),
  resetAssetSurvey: () =>
    set({
      assetSurvey: {
        step1: { savings: 0, stocks: 0, realEstate: 0, debt: 0 },
        step2: { irregularExpenses: 0 },
        step3: { riskTolerance: "MODERATE", experience: "", targetReturn: 5 },
        step4: { goal: "", targetAmount: 0, period: 12 },
        status: "IDLE",
      },
      assetAnalysis: null,
    }),

  syncData: (communityId) => {
    if (!communityId) return () => {};
    console.log('Starting data synchronization for community:', communityId);
    const unsubscribes: (() => void)[] = [];

    // Sync Users in Community
    const usersQuery = query(
      collection(db, "users"),
      where("communityId", "==", communityId),
    );
    unsubscribes.push(
      onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as User,
          );
          set({ users });
        },
        (err) => handleFirestoreError(err, OperationType.LIST, "users"),
      ),
    );

    // Sync Transactions
    const transQuery = query(
      collection(db, `communities/${communityId}/transactions`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        transQuery,
        (snapshot) => {
          const transactions = snapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                description: cleanHtmlEntities(data.description),
                comments: (data.comments || []).map((c: any) => ({
                  ...c,
                  text: cleanHtmlEntities(c.text)
                }))
              } as Transaction;
            },
          );
          set({ transactions });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/transactions`,
          ),
      ),
    );

    // Sync Diaries
    const diaryQuery = query(
      collection(db, `communities/${communityId}/diaries`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        diaryQuery,
        (snapshot) => {
          const diaries = snapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                title: cleanHtmlEntities(data.title),
                text: cleanHtmlEntities(data.text),
                comments: (data.comments || []).map((c: any) => ({
                  ...c,
                  text: cleanHtmlEntities(c.text)
                }))
              } as DiaryEntry;
            },
          );
          set({ diaries });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/diaries`,
          ),
      ),
    );

    // Sync Schedules
    const scheduleQuery = query(
      collection(db, `communities/${communityId}/schedules`),
    );
    unsubscribes.push(
      onSnapshot(
        scheduleQuery,
        (snapshot) => {
          const schedules = snapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                title: cleanHtmlEntities(data.title),
                description: cleanHtmlEntities(data.description)
              } as ScheduleEntry;
            },
          );
          set({ schedules });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/schedules`,
          ),
      ),
    );

    // Sync Fixed Expenses
    const fixedQuery = query(
      collection(db, `communities/${communityId}/fixedExpenses`),
    );
    unsubscribes.push(
      onSnapshot(
        fixedQuery,
        (snapshot) => {
          const fixedExpenses = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as FixedExpense,
          );
          set({ fixedExpenses });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/fixedExpenses`,
          ),
      ),
    );

    // Sync Categories
    const categoriesQuery = query(
      collection(db, `communities/${communityId}/categories`),
    );
    unsubscribes.push(
      onSnapshot(
        categoriesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const categories = snapshot.docs.map(
              (doc) => ({ ...doc.data(), id: doc.id }) as Category,
            );
            set({ categories });
          }
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/categories`,
          ),
      ),
    );

    // Sync Counseling Records
    const counselingQuery = query(
      collection(db, `communities/${communityId}/counseling`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        counselingQuery,
        (snapshot) => {
          const counselingRecords = snapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                diaryText: cleanHtmlEntities(data.diaryText),
                aiAdvice: cleanHtmlEntities(data.aiAdvice)
              } as CounselingRecord;
            },
          );
          set({ counselingRecords });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/counseling`,
          ),
      ),
    );

    // Sync Life Routines
    const routineQuery = query(
      collection(db, `communities/${communityId}/routines`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        routineQuery,
        (snapshot) => {
          const lifeRoutines = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as LifeRoutine,
          );
          set({ lifeRoutines });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/routines`,
          ),
      ),
    );

    // Sync Psychological Reports
    const reportQuery = query(
      collection(db, `communities/${communityId}/psych_reports`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        reportQuery,
        (snapshot) => {
          const psychologicalReports = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as PsychologicalReport,
          );
          set({ psychologicalReports });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/psych_reports`,
          ),
      ),
    );

    // Sync Relationship Reports
    const relReportQuery = query(
      collection(db, `communities/${communityId}/rel_reports`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        relReportQuery,
        (snapshot) => {
          const relationshipReports = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as RelationshipReport,
          );
          set({ relationshipReports });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/rel_reports`,
          ),
      ),
    );

    // Sync Support Messages
    const supportQuery = query(
      collection(db, `communities/${communityId}/support_messages`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        supportQuery,
        (snapshot) => {
          const supportMessages = snapshot.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as SupportMessage,
          );
          set({ supportMessages });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/support_messages`,
          ),
      ),
    );

    // Sync Notices
    const noticesQuery = query(
      collection(db, `communities/${communityId}/notices`),
      orderBy("createdAt", "desc"),
    );
    unsubscribes.push(
      onSnapshot(
        noticesQuery,
        (snapshot) => {
          const notices = snapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                title: cleanHtmlEntities(data.title),
                content: cleanHtmlEntities(data.content),
                comments: (data.comments || []).map((c: any) => ({
                  ...c,
                  text: cleanHtmlEntities(c.text)
                }))
              } as Notice;
            },
          );
          set({ notices });
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `communities/${communityId}/notices`,
          ),
      ),
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  },

  addTransaction: async (transaction) => {
    const { communityId } = get();
    if (!communityId) {
      throw new Error("공동체 ID가 없습니다. 다시 로그인해 주세요.");
    }
    try {
      await addDoc(collection(db, `communities/${communityId}/transactions`), {
        ...transaction,
        description: cleanHtmlEntities(transaction.description),
        createdAt: new Date().toISOString(),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/transactions`,
      );
    }
  },

  updateTransaction: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      const cleanUpdates = { ...updates };
      if (cleanUpdates.description) cleanUpdates.description = cleanHtmlEntities(cleanUpdates.description);
      
      await updateDoc(
        doc(db, `communities/${communityId}/transactions`, id),
        cleanUpdates,
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/transactions`,
      );
    }
  },

  deleteTransaction: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/transactions`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/transactions`,
      );
    }
  },

  addDiary: async (diary) => {
    const { communityId } = get();
    const startTime = Date.now();
    console.log("[Store] addDiary started", { communityId, diaryTitle: diary.title });
    if (!communityId) {
      throw new Error("공동체 ID가 없습니다. 다시 로그인해 주세요.");
    }
    try {
      const docData = {
        ...diary,
        title: cleanHtmlEntities(diary.title),
        text: cleanHtmlEntities(diary.text),
        createdAt: new Date().toISOString(),
        communityId,
      };
      const docRef = await addDoc(collection(db, `communities/${communityId}/diaries`), docData);
      const duration = Date.now() - startTime;
      console.log(`[Store] addDiary success (${duration}ms)`, docRef.id);
    } catch (err) {
      console.error("[Store] addDiary error", err);
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  updateDiary: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      const cleanUpdates = { ...updates };
      if (cleanUpdates.title) cleanUpdates.title = cleanHtmlEntities(cleanUpdates.title);
      if (cleanUpdates.text) cleanUpdates.text = cleanHtmlEntities(cleanUpdates.text);

      await updateDoc(
        doc(db, `communities/${communityId}/diaries`, id),
        cleanUpdates,
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  deleteDiary: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/diaries`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  addSchedule: async (schedule) => {
    const { communityId } = get();
    if (!communityId) {
      throw new Error("공동체 ID가 없습니다. 다시 로그인해 주세요.");
    }
    try {
      await addDoc(collection(db, `communities/${communityId}/schedules`), {
        ...schedule,
        title: cleanHtmlEntities(schedule.title),
        description: cleanHtmlEntities(schedule.description),
        createdAt: new Date().toISOString(),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/schedules`,
      );
    }
  },

  updateSchedule: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      const cleanUpdates = { ...updates };
      if (cleanUpdates.title) cleanUpdates.title = cleanHtmlEntities(cleanUpdates.title);
      if (cleanUpdates.description) cleanUpdates.description = cleanHtmlEntities(cleanUpdates.description);

      await updateDoc(
        doc(db, `communities/${communityId}/schedules`, id),
        cleanUpdates,
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/schedules`,
      );
    }
  },

  deleteSchedule: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/schedules`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/schedules`,
      );
    }
  },

  addFixedExpense: async (expense) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/fixedExpenses`), {
        ...expense,
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/fixedExpenses`,
      );
    }
  },

  deleteFixedExpense: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/fixedExpenses`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/fixedExpenses`,
      );
    }
  },

  addCounselingRecord: async (record) => {
    const { communityId } = get();
    console.log("[Store] addCounselingRecord called", { communityId, record });
    if (!communityId) {
      throw new Error("공동체 ID가 없습니다. 데이터를 저장할 수 없습니다.");
    }
    try {
      const docRef = await addDoc(collection(db, `communities/${communityId}/counseling`), {
        ...record,
        diaryText: cleanHtmlEntities(record.diaryText),
        aiAdvice: cleanHtmlEntities(record.aiAdvice),
        communityId,
      });
      console.log("[Store] addCounselingRecord success", docRef.id);
    } catch (err) {
      console.error("[Store] addCounselingRecord error", err);
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/counseling`,
      );
    }
  },

  deleteCounselingRecord: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/counseling`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/counseling`,
      );
    }
  },

  importData: async (data: any) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      if (data.transactions && Array.isArray(data.transactions)) {
        await Promise.all(data.transactions.map((t: any) => addDoc(collection(db, `communities/${communityId}/transactions`), { ...t, communityId })));
      }
      if (data.diaries && Array.isArray(data.diaries)) {
        await Promise.all(data.diaries.map((d: any) => addDoc(collection(db, `communities/${communityId}/diaries`), { ...d, communityId })));
      }
      if (data.schedules && Array.isArray(data.schedules)) {
        await Promise.all(data.schedules.map((s: any) => addDoc(collection(db, `communities/${communityId}/schedules`), { ...s, communityId })));
      }
      if (data.fixedExpenses && Array.isArray(data.fixedExpenses)) {
        await Promise.all(data.fixedExpenses.map((f: any) => addDoc(collection(db, `communities/${communityId}/fixedExpenses`), { ...f, communityId })));
      }
    } catch (err) {
      console.error("[Store] importData error", err);
      handleFirestoreError(err, OperationType.WRITE, `communities/${communityId}`);
    }
  },

  updateUser: async (id, updates) => {
    try {
      await updateDoc(doc(db, "users", id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
    }
  },

  resetAllData: async () => {
    const { communityId, transactions, diaries, schedules, fixedExpenses } =
      get();
    if (!communityId) return;

    const deletePromises = [
      ...transactions.map((t) =>
        deleteDoc(doc(db, `communities/${communityId}/transactions`, t.id)),
      ),
      ...diaries.map((d) =>
        deleteDoc(doc(db, `communities/${communityId}/diaries`, d.id)),
      ),
      ...schedules.map((s) =>
        deleteDoc(doc(db, `communities/${communityId}/schedules`, s.id)),
      ),
      ...fixedExpenses.map((f) =>
        deleteDoc(doc(db, `communities/${communityId}/fixedExpenses`, f.id)),
      ),
    ];

    try {
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `communities/${communityId}`,
      );
    }
  },

  setCategories: async (updatedCategories) => {
    const { communityId, categories: oldCategories } = get();
    if (!communityId) return;

    try {
      // Find deleted categories
      const deleted = oldCategories.filter(
        (oc) => !updatedCategories.find((nc) => nc.id === oc.id),
      );
      for (const cat of deleted) {
        await deleteDoc(
          doc(db, `communities/${communityId}/categories`, cat.id),
        );
      }

      // Update or add categories
      for (const cat of updatedCategories) {
        await setDoc(doc(db, `communities/${communityId}/categories`, cat.id), {
          ...cat,
          communityId,
        });
      }

      set({ categories: updatedCategories });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `communities/${communityId}/categories`,
      );
    }
  },

  addLifeRoutine: async (routine) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/routines`), {
        ...routine,
        createdAt: new Date().toISOString(),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/routines`,
      );
    }
  },

  updateLifeRoutine: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await updateDoc(
        doc(db, `communities/${communityId}/routines`, id),
        updates,
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/routines`,
      );
    }
  },

  toggleRoutineTask: async (routineId, dayIndex, taskId) => {
    const { communityId, lifeRoutines } = get();
    if (!communityId) return;
    const routine = lifeRoutines.find((r) => r.id === routineId);
    if (!routine) return;

    const newDays = [...routine.days];
    const day = { ...newDays[dayIndex] };
    const tasks = day.tasks.map((t) =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
    );
    day.tasks = tasks;
    newDays[dayIndex] = day;

    try {
      await updateDoc(
        doc(db, `communities/${communityId}/routines`, routineId),
        {
          days: newDays,
        },
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/routines`,
      );
    }
  },

  addPsychologicalReport: async (report) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/psych_reports`), {
        ...report,
        createdAt: new Date().toISOString(),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/psych_reports`,
      );
    }
  },

  deletePsychologicalReport: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/psych_reports`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/psych_reports`,
      );
    }
  },

  addRelationshipReport: async (report) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/rel_reports`), {
        ...report,
        createdAt: new Date().toISOString(),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/rel_reports`,
      );
    }
  },

  deleteRelationshipReport: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/rel_reports`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/rel_reports`,
      );
    }
  },

  addSupportMessage: async (message) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/support_messages`), {
        ...message,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/support_messages`,
      );
    }
  },

  updateSupportMessage: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await updateDoc(doc(db, `communities/${communityId}/support_messages`, id), updates);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/support_messages`,
      );
    }
  },

  addNotice: async (notice) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await addDoc(collection(db, `communities/${communityId}/notices`), {
        ...notice,
        title: cleanHtmlEntities(notice.title),
        content: cleanHtmlEntities(notice.content),
        communityId,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `communities/${communityId}/notices`,
      );
    }
  },

  updateNotice: async (id, updates) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      const cleanUpdates = { ...updates };
      if (cleanUpdates.title) cleanUpdates.title = cleanHtmlEntities(cleanUpdates.title);
      if (cleanUpdates.content) cleanUpdates.content = cleanHtmlEntities(cleanUpdates.content);

      await updateDoc(doc(db, `communities/${communityId}/notices`, id), cleanUpdates);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/notices`,
      );
    }
  },

  deleteNotice: async (id) => {
    const { communityId } = get();
    if (!communityId) return;
    try {
      await deleteDoc(doc(db, `communities/${communityId}/notices`, id));
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `communities/${communityId}/notices`,
      );
    }
  },

  toggleNoticeLike: async (noticeId, userId) => {
    const { communityId, notices } = get();
    if (!communityId) return;
    const notice = notices.find((n) => n.id === noticeId);
    if (!notice) return;

    const likes = notice.likes || [];
    const newLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    try {
      await updateDoc(doc(db, `communities/${communityId}/notices`, noticeId), {
        likes: newLikes,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/notices`,
      );
    }
  },

  addNoticeComment: async (noticeId, comment) => {
    const { communityId, notices } = get();
    if (!communityId) return;
    const notice = notices.find((n) => n.id === noticeId);
    if (!notice) return;

    const comments = notice.comments || [];
    const newComment = { 
      ...comment, 
      id: `c_${Date.now()}`,
      text: cleanHtmlEntities(comment.text)
    };

    try {
      await updateDoc(doc(db, `communities/${communityId}/notices`, noticeId), {
        comments: [...comments, newComment],
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/notices`,
      );
    }
  },

  incrementNoticeViewCount: async (noticeId) => {
    const { communityId, notices } = get();
    if (!communityId) return;
    const notice = notices.find((n) => n.id === noticeId);
    if (!notice) return;

    try {
      await updateDoc(doc(db, `communities/${communityId}/notices`, noticeId), {
        viewCount: (notice.viewCount || 0) + 1,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/notices`,
      );
    }
  },

  toggleTransactionLike: async (transactionId, userId) => {
    const { communityId, transactions } = get();
    if (!communityId) return;
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const likes = transaction.likes || [];
    const newLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    try {
      await updateDoc(
        doc(db, `communities/${communityId}/transactions`, transactionId),
        { likes: newLikes },
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/transactions`,
      );
    }
  },

  addTransactionComment: async (transactionId, comment) => {
    const { communityId, transactions } = get();
    if (!communityId) return;
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const comments = transaction.comments || [];
    const newComment = { 
      ...comment, 
      id: `c_${Date.now()}`,
      text: cleanHtmlEntities(comment.text)
    };

    try {
      await updateDoc(
        doc(db, `communities/${communityId}/transactions`, transactionId),
        {
          comments: [...comments, newComment],
        },
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/transactions`,
      );
    }
  },

  toggleDiaryLike: async (diaryId, userId) => {
    const { communityId, diaries } = get();
    if (!communityId) return;
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;

    const reactions = diary.reactions || [];
    const newReactions = reactions.includes(userId)
      ? reactions.filter((id) => id !== userId)
      : [...reactions, userId];

    try {
      await updateDoc(doc(db, `communities/${communityId}/diaries`, diaryId), {
        reactions: newReactions,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  addDiaryComment: async (diaryId, comment) => {
    const { communityId, diaries } = get();
    if (!communityId) return;
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;

    const comments = diary.comments || [];
    const newComment = { 
      ...comment, 
      id: `c_${Date.now()}`,
      text: cleanHtmlEntities(comment.text)
    };

    try {
      await updateDoc(doc(db, `communities/${communityId}/diaries`, diaryId), {
        comments: [...comments, newComment],
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  addDiarySticker: async (diaryId, userId, stickerType) => {
    const { communityId, diaries } = get();
    if (!communityId) return;
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;

    // Replace existing sticker by same user or add new one
    const existingStickers = diary.stickers || [];
    const otherStickers = existingStickers.filter((s) => s.userId !== userId);

    const newSticker = {
      id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: stickerType,
      x: 0,
      y: 0,
    };

    try {
      await updateDoc(doc(db, `communities/${communityId}/diaries`, diaryId), {
        stickers: [...otherStickers, newSticker],
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  updateDiarySticker: async (diaryId, stickerId, updates) => {
    const { communityId, diaries } = get();
    if (!communityId) return;
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;

    const stickers = (diary.stickers || []).map((s) =>
      s.id === stickerId ? { ...s, ...updates } : s,
    );

    try {
      await updateDoc(doc(db, `communities/${communityId}/diaries`, diaryId), {
        stickers,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },

  removeDiarySticker: async (diaryId, stickerId) => {
    const { communityId, diaries } = get();
    if (!communityId) return;
    const diary = diaries.find((d) => d.id === diaryId);
    if (!diary) return;

    const stickers = (diary.stickers || []).filter((s) => s.id !== stickerId);

    try {
      await updateDoc(doc(db, `communities/${communityId}/diaries`, diaryId), {
        stickers,
      });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `communities/${communityId}/diaries`,
      );
    }
  },
}));
