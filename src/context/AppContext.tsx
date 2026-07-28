import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  currentUser,
  services as initialServices,
} from "../data/mockData";

export type HistoryItem = {
  id: number;
  type: string;
  description: string;
  credits: number;
  date: string;
};

export type User = {
  name: string;
  email?: string;
  phone?: string;
  city: string;
  community?: string;
  bio?: string;
  skills?: string[];
  avatar?: string;
  credits: number;
  offeredServices: string[];
  neededServices: string[];
  history: HistoryItem[];
};

export type Service = {
  id: number;
  supabaseId?: string;
  person: string;
  service: string;
  category: string;
  mode: string;
  credits: number;
  avatar?: string;
  rating?: number;
  description?: string;
  serviceType?: "offer" | "request";
  createdAt?: string;
};

export type ServiceRequest = {
  id: number;
  supabaseId?: string;
  serviceId: number | string;
  serviceName: string;
  providerName: string;
  requesterName: string;
  credits: number;
  status: "pending" | "completed" | "cancelled";
  date: string;
};

export type Review = {
  id: number;
  supabaseId?: string;
  serviceId: number | string;
  providerName: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
};

export type ChatMessage = {
  id: number;
  supabaseId?: string;
  conversationWith: string;
  sender: string;
  text: string;
  date: string;
};

export type NotificationItem = {
  id: number;
  supabaseId?: string;
  title: string;
  message: string;
  type:
    | "service"
    | "request"
    | "credit"
    | "review"
    | "chat";
  read: boolean;
  date: string;
};

type AppContextType = {
  user: User;
  services: Service[];
  requests: ServiceRequest[];
  reviews: Review[];
  messages: ChatMessage[];
  notifications: NotificationItem[];
  favoriteServiceIds: number[];
  isLoading: boolean;
  updateUser: (newUser: Partial<User>) => void;
  addService: (
    service: Omit<Service, "id">
  ) => void;
  updateService: (
    id: number,
    updatedService: Partial<Service>
  ) => void;
  deleteService: (id: number) => void;
  createRequest: (service: Service) => boolean;
  createIncomingRequest: (
    service: Service
  ) => void;
  completeRequest: (
    requestId: number
  ) => boolean;
  cancelRequest: (requestId: number) => void;
  toggleFavorite: (serviceId: number) => void;
  addReview: (
    review: Omit<Review, "id" | "date">
  ) => void;
  sendMessage: (
    conversationWith: string,
    text: string
  ) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  resetLocalData: () => void;
};

const USER_STORAGE_KEY = "banco_tiempo_user";
const SERVICES_STORAGE_KEY = "banco_tiempo_services";
const REQUESTS_STORAGE_KEY = "banco_tiempo_requests";
const FAVORITES_STORAGE_KEY = "banco_tiempo_favorites";
const REVIEWS_STORAGE_KEY = "banco_tiempo_reviews";
const MESSAGES_STORAGE_KEY = "banco_tiempo_messages";
const NOTIFICATIONS_STORAGE_KEY =
  "banco_tiempo_notifications";

const AppContext =
  createContext<AppContextType | undefined>(
    undefined
  );

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User>(currentUser);

  const [services, setServices] =
    useState<Service[]>(initialServices);

  const [requests, setRequests] =
    useState<ServiceRequest[]>([]);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [
    favoriteServiceIds,
    setFavoriteServiceIds,
  ] = useState<number[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    loadLocalData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(user)
      );

      AsyncStorage.setItem(
        SERVICES_STORAGE_KEY,
        JSON.stringify(services)
      );

      AsyncStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(requests)
      );

      AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteServiceIds)
      );

      AsyncStorage.setItem(
        REVIEWS_STORAGE_KEY,
        JSON.stringify(reviews)
      );

      AsyncStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify(messages)
      );

      AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notifications)
      );
    }
  }, [
    user,
    services,
    requests,
    favoriteServiceIds,
    reviews,
    messages,
    notifications,
    isLoading,
  ]);

  const loadLocalData = async () => {
    try {
      const savedUser =
        await AsyncStorage.getItem(
          USER_STORAGE_KEY
        );

      const savedServices =
        await AsyncStorage.getItem(
          SERVICES_STORAGE_KEY
        );

      const savedRequests =
        await AsyncStorage.getItem(
          REQUESTS_STORAGE_KEY
        );

      const savedFavorites =
        await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY
        );

      const savedReviews =
        await AsyncStorage.getItem(
          REVIEWS_STORAGE_KEY
        );

      const savedMessages =
        await AsyncStorage.getItem(
          MESSAGES_STORAGE_KEY
        );

      const savedNotifications =
        await AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        );

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setUser({
          ...currentUser,
          ...parsedUser,
          community:
            parsedUser.community ?? "",
          bio: parsedUser.bio ?? "",
          skills: Array.isArray(parsedUser.skills)
            ? parsedUser.skills
            : [],
        });
      }

      if (savedServices) {
        setServices(
          JSON.parse(savedServices)
        );
      }

      if (savedRequests) {
        setRequests(
          JSON.parse(savedRequests)
        );
      }

      if (savedFavorites) {
        setFavoriteServiceIds(
          JSON.parse(savedFavorites)
        );
      }

      if (savedReviews) {
        setReviews(
          JSON.parse(savedReviews)
        );
      }

      if (savedMessages) {
        setMessages(
          JSON.parse(savedMessages)
        );
      }

      if (savedNotifications) {
        setNotifications(
          JSON.parse(savedNotifications)
        );
      }
    } catch (error) {
      console.log(
        "Error cargando datos locales:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem["type"]
  ) => {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    setNotifications(
      (previousNotifications) => [
        {
          id: Date.now(),
          title,
          message,
          type,
          read: false,
          date: today,
        },
        ...previousNotifications,
      ]
    );
  };

  /*
   * Sin notificación automática.
   * Esta función también se usa para sincronizar
   * el perfil leído desde Supabase.
   */
  const updateUser = (
    newUser: Partial<User>
  ) => {
    setUser((previousUser) => ({
      ...previousUser,
      ...newUser,
    }));
  };

  const addService = (
    service: Omit<Service, "id">
  ) => {
    setServices((previousServices) => [
      {
        ...service,
        id: Date.now(),
      },
      ...previousServices,
    ]);

    addNotification(
      "Servicio publicado",
      `Publicaste: ${service.service}`,
      "service"
    );
  };

  const updateService = (
    id: number,
    updatedService: Partial<Service>
  ) => {
    setServices((previousServices) =>
      previousServices.map((service) =>
        service.id === id
          ? {
              ...service,
              ...updatedService,
            }
          : service
      )
    );

    addNotification(
      "Servicio actualizado",
      "Tu servicio fue actualizado correctamente.",
      "service"
    );
  };

  const deleteService = (id: number) => {
    setServices((previousServices) =>
      previousServices.filter(
        (service) => service.id !== id
      )
    );

    setFavoriteServiceIds(
      (previousFavorites) =>
        previousFavorites.filter(
          (serviceId) => serviceId !== id
        )
    );

    addNotification(
      "Servicio eliminado",
      "Eliminaste un servicio publicado.",
      "service"
    );
  };

  const createRequest = (
    service: Service
  ) => {
    if (user.credits < service.credits) {
      return false;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const newRequest: ServiceRequest = {
      id: Date.now(),
      serviceId: service.id,
      serviceName: service.service,
      providerName: service.person,
      requesterName: user.name,
      credits: service.credits,
      status: "pending",
      date: today,
    };

    setRequests((previousRequests) => [
      newRequest,
      ...previousRequests,
    ]);

    addNotification(
      "Solicitud creada",
      `Solicitaste ${service.service} con ${service.person}.`,
      "request"
    );

    return true;
  };

  const createIncomingRequest = (
    service: Service
  ) => {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const newRequest: ServiceRequest = {
      id: Date.now(),
      serviceId: service.id,
      serviceName: service.service,
      providerName: user.name,
      requesterName: "Usuario de prueba",
      credits: service.credits,
      status: "pending",
      date: today,
    };

    setRequests((previousRequests) => [
      newRequest,
      ...previousRequests,
    ]);

    addNotification(
      "Nueva solicitud recibida",
      `Alguien solicitó tu servicio: ${service.service}.`,
      "request"
    );
  };

  const completeRequest = (
    requestId: number
  ) => {
    const selectedRequest =
      requests.find(
        (request) =>
          request.id === requestId
      );

    if (
      !selectedRequest ||
      selectedRequest.status !== "pending"
    ) {
      return false;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const isRequester =
      selectedRequest.requesterName ===
      user.name;

    const isProvider =
      selectedRequest.providerName ===
      user.name;

    if (
      isRequester &&
      user.credits <
        selectedRequest.credits
    ) {
      return false;
    }

    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "completed",
            }
          : request
      )
    );

    setUser((previousUser) => {
      if (isProvider) {
        return {
          ...previousUser,
          credits:
            previousUser.credits +
            selectedRequest.credits,
          history: [
            {
              id: Date.now(),
              type: "earned",
              description: `Completó ${selectedRequest.serviceName} para ${selectedRequest.requesterName}`,
              credits:
                selectedRequest.credits,
              date: today,
            },
            ...previousUser.history,
          ],
        };
      }

      return {
        ...previousUser,
        credits:
          previousUser.credits -
          selectedRequest.credits,
        history: [
          {
            id: Date.now(),
            type: "spent",
            description: `Completó ${selectedRequest.serviceName} con ${selectedRequest.providerName}`,
            credits:
              selectedRequest.credits,
            date: today,
          },
          ...previousUser.history,
        ],
      };
    });

    addNotification(
      "Servicio completado",
      isProvider
        ? `Ganaste ${selectedRequest.credits} crédito por completar ${selectedRequest.serviceName}.`
        : `Gastaste ${selectedRequest.credits} crédito en ${selectedRequest.serviceName}.`,
      "credit"
    );

    return true;
  };

  const cancelRequest = (
    requestId: number
  ) => {
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "cancelled",
            }
          : request
      )
    );

    addNotification(
      "Solicitud cancelada",
      "Cancelaste una solicitud de servicio.",
      "request"
    );
  };

  const toggleFavorite = (
    serviceId: number
  ) => {
    setFavoriteServiceIds(
      (previousFavorites) => {
        if (
          previousFavorites.includes(
            serviceId
          )
        ) {
          return previousFavorites.filter(
            (id) => id !== serviceId
          );
        }

        return [
          ...previousFavorites,
          serviceId,
        ];
      }
    );
  };

  const addReview = (
    review: Omit<
      Review,
      "id" | "date"
    >
  ) => {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    setReviews((previousReviews) => [
      {
        ...review,
        id: Date.now(),
        date: today,
      },
      ...previousReviews,
    ]);

    addNotification(
      "Review enviada",
      `Calificaste a ${review.providerName} con ${review.rating} estrellas.`,
      "review"
    );
  };

  const sendMessage = (
    conversationWith: string,
    text: string
  ) => {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const newMessage: ChatMessage = {
      id: Date.now(),
      conversationWith,
      sender: user.name,
      text,
      date: today,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    addNotification(
      "Mensaje enviado",
      `Enviaste un mensaje a ${conversationWith}.`,
      "chat"
    );
  };

  const markNotificationsAsRead =
    () => {
      setNotifications(
        (previousNotifications) =>
          previousNotifications.map(
            (notification) => ({
              ...notification,
              read: true,
            })
          )
      );
    };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetLocalData = async () => {
    await AsyncStorage.removeItem(
      USER_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      SERVICES_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      REQUESTS_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      FAVORITES_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      REVIEWS_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      MESSAGES_STORAGE_KEY
    );

    await AsyncStorage.removeItem(
      NOTIFICATIONS_STORAGE_KEY
    );

    setUser({
      ...currentUser,
      community: "",
      bio: "",
      skills: [],
    });

    setServices(initialServices);
    setRequests([]);
    setFavoriteServiceIds([]);
    setReviews([]);
    setMessages([]);
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        services,
        requests,
        reviews,
        messages,
        notifications,
        favoriteServiceIds,
        isLoading,
        updateUser,
        addService,
        updateService,
        deleteService,
        createRequest,
        createIncomingRequest,
        completeRequest,
        cancelRequest,
        toggleFavorite,
        addReview,
        sendMessage,
        markNotificationsAsRead,
        clearNotifications,
        resetLocalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext debe usarse dentro de AppProvider"
    );
  }

  return context;
}