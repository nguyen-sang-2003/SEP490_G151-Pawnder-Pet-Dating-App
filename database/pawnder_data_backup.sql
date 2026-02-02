--
-- PostgreSQL database dump
--

\restrict ff7caTLc6PxbwqiSNDVyrCQQov640iQcMdJMgbpBPtyCYg37GQyHbDFXgeaHo31

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.0

-- Started on 2026-02-02 09:33:10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pawnder_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO pawnder_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16419)
-- Name: Address; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Address" (
    "AddressId" integer NOT NULL,
    "Latitude" numeric(9,6),
    "Longitude" numeric(9,6),
    "FullAddress" text NOT NULL,
    "City" character varying(100),
    "District" character varying(100),
    "Ward" character varying(100),
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Address" OWNER TO pawnder_user;

--
-- TOC entry 223 (class 1259 OID 16418)
-- Name: Address_AddressId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Address_AddressId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Address_AddressId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3872 (class 0 OID 0)
-- Dependencies: 223
-- Name: Address_AddressId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Address_AddressId_seq" OWNED BY public."Address"."AddressId";


--
-- TOC entry 230 (class 1259 OID 16487)
-- Name: Attribute; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Attribute" (
    "AttributeId" integer NOT NULL,
    "Name" character varying(100) NOT NULL,
    "TypeValue" character varying(50),
    "Unit" character varying(20),
    "Percent" numeric(5,2) DEFAULT 0,
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Attribute" OWNER TO pawnder_user;

--
-- TOC entry 232 (class 1259 OID 16500)
-- Name: AttributeOption; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."AttributeOption" (
    "OptionId" integer NOT NULL,
    "AttributeId" integer,
    "Name" character varying(100) NOT NULL,
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."AttributeOption" OWNER TO pawnder_user;

--
-- TOC entry 231 (class 1259 OID 16499)
-- Name: AttributeOption_OptionId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."AttributeOption_OptionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AttributeOption_OptionId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3873 (class 0 OID 0)
-- Dependencies: 231
-- Name: AttributeOption_OptionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."AttributeOption_OptionId_seq" OWNED BY public."AttributeOption"."OptionId";


--
-- TOC entry 229 (class 1259 OID 16486)
-- Name: Attribute_AttributeId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Attribute_AttributeId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Attribute_AttributeId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3874 (class 0 OID 0)
-- Dependencies: 229
-- Name: Attribute_AttributeId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Attribute_AttributeId_seq" OWNED BY public."Attribute"."AttributeId";


--
-- TOC entry 262 (class 1259 OID 16868)
-- Name: BadWord; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."BadWord" (
    "BadWordId" integer NOT NULL,
    "Word" character varying(200) NOT NULL,
    "IsRegex" boolean DEFAULT false,
    "Level" integer NOT NULL,
    "Category" character varying(50),
    "IsActive" boolean DEFAULT true,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT "BadWord_Level_check" CHECK ((("Level" >= 1) AND ("Level" <= 3)))
);


ALTER TABLE public."BadWord" OWNER TO pawnder_user;

--
-- TOC entry 3875 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE "BadWord"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON TABLE public."BadWord" IS 'Bảng quản lý từ cấm trong chat';


--
-- TOC entry 3876 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN "BadWord"."IsRegex"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."BadWord"."IsRegex" IS 'true nếu Word là regex pattern, false nếu là text thường';


--
-- TOC entry 3877 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN "BadWord"."Level"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."BadWord"."Level" IS '1: Che từ (***), 2-3: Block hoàn toàn';


--
-- TOC entry 3878 (class 0 OID 0)
-- Dependencies: 262
-- Name: COLUMN "BadWord"."Category"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."BadWord"."Category" IS 'Phân loại: Thô tục, Scam, Hate Speech, etc.';


--
-- TOC entry 261 (class 1259 OID 16867)
-- Name: BadWord_BadWordId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."BadWord_BadWordId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BadWord_BadWordId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3879 (class 0 OID 0)
-- Dependencies: 261
-- Name: BadWord_BadWordId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."BadWord_BadWordId_seq" OWNED BY public."BadWord"."BadWordId";


--
-- TOC entry 250 (class 1259 OID 16747)
-- Name: Block; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Block" (
    "FromUserId" integer NOT NULL,
    "ToUserId" integer NOT NULL,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Block" OWNER TO pawnder_user;

--
-- TOC entry 240 (class 1259 OID 16608)
-- Name: ChatAI; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatAI" (
    "ChatAIId" integer NOT NULL,
    "UserId" integer,
    "Title" character varying(200),
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatAI" OWNER TO pawnder_user;

--
-- TOC entry 242 (class 1259 OID 16624)
-- Name: ChatAIContent; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatAIContent" (
    "ContentId" integer NOT NULL,
    "ChatAIId" integer,
    "Question" text,
    "Answer" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatAIContent" OWNER TO pawnder_user;

--
-- TOC entry 241 (class 1259 OID 16623)
-- Name: ChatAIContent_ContentId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatAIContent_ContentId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatAIContent_ContentId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3880 (class 0 OID 0)
-- Dependencies: 241
-- Name: ChatAIContent_ContentId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatAIContent_ContentId_seq" OWNED BY public."ChatAIContent"."ContentId";


--
-- TOC entry 239 (class 1259 OID 16607)
-- Name: ChatAI_ChatAIId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatAI_ChatAIId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatAI_ChatAIId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3881 (class 0 OID 0)
-- Dependencies: 239
-- Name: ChatAI_ChatAIId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatAI_ChatAIId_seq" OWNED BY public."ChatAI"."ChatAIId";


--
-- TOC entry 258 (class 1259 OID 16820)
-- Name: ChatExpert; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatExpert" (
    "ChatExpertId" integer NOT NULL,
    "ExpertId" integer,
    "UserId" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatExpert" OWNER TO pawnder_user;

--
-- TOC entry 260 (class 1259 OID 16840)
-- Name: ChatExpertContent; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatExpertContent" (
    "ContentId" integer NOT NULL,
    "ChatExpertId" integer,
    "FromId" integer,
    "Message" text,
    "ExpertId" integer,
    "UserId" integer,
    "ChatAIId" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatExpertContent" OWNER TO pawnder_user;

--
-- TOC entry 259 (class 1259 OID 16839)
-- Name: ChatExpertContent_ContentId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatExpertContent_ContentId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatExpertContent_ContentId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3882 (class 0 OID 0)
-- Dependencies: 259
-- Name: ChatExpertContent_ContentId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatExpertContent_ContentId_seq" OWNED BY public."ChatExpertContent"."ContentId";


--
-- TOC entry 257 (class 1259 OID 16819)
-- Name: ChatExpert_ChatExpertId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatExpert_ChatExpertId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatExpert_ChatExpertId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3883 (class 0 OID 0)
-- Dependencies: 257
-- Name: ChatExpert_ChatExpertId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatExpert_ChatExpertId_seq" OWNED BY public."ChatExpert"."ChatExpertId";


--
-- TOC entry 245 (class 1259 OID 16668)
-- Name: ChatUser; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatUser" (
    "MatchId" integer NOT NULL,
    "FromPetId" integer,
    "ToPetId" integer,
    "FromUserId" integer,
    "ToUserId" integer,
    "Status" character varying(50),
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatUser" OWNER TO pawnder_user;

--
-- TOC entry 247 (class 1259 OID 16699)
-- Name: ChatUserContent; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ChatUserContent" (
    "ContentId" integer NOT NULL,
    "MatchId" integer,
    "FromUserId" integer,
    "FromPetId" integer,
    "Message" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ChatUserContent" OWNER TO pawnder_user;

--
-- TOC entry 246 (class 1259 OID 16698)
-- Name: ChatUserContent_ContentId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatUserContent_ContentId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatUserContent_ContentId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3884 (class 0 OID 0)
-- Dependencies: 246
-- Name: ChatUserContent_ContentId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatUserContent_ContentId_seq" OWNED BY public."ChatUserContent"."ContentId";


--
-- TOC entry 244 (class 1259 OID 16667)
-- Name: ChatUser_MatchId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."ChatUser_MatchId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatUser_MatchId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3885 (class 0 OID 0)
-- Dependencies: 244
-- Name: ChatUser_MatchId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."ChatUser_MatchId_seq" OWNED BY public."ChatUser"."MatchId";


--
-- TOC entry 256 (class 1259 OID 16800)
-- Name: DailyLimit; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."DailyLimit" (
    "LimitId" integer NOT NULL,
    "UserId" integer NOT NULL,
    "ActionType" character varying(100) NOT NULL,
    "ActionDate" date NOT NULL,
    "Count" integer DEFAULT 1,
    "CreatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."DailyLimit" OWNER TO pawnder_user;

--
-- TOC entry 255 (class 1259 OID 16799)
-- Name: DailyLimit_LimitId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."DailyLimit_LimitId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DailyLimit_LimitId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3886 (class 0 OID 0)
-- Dependencies: 255
-- Name: DailyLimit_LimitId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."DailyLimit_LimitId_seq" OWNED BY public."DailyLimit"."LimitId";


--
-- TOC entry 276 (class 1259 OID 17187)
-- Name: EventSubmission; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."EventSubmission" (
    "SubmissionId" integer NOT NULL,
    "EventId" integer NOT NULL,
    "UserId" integer NOT NULL,
    "PetId" integer NOT NULL,
    "MediaUrl" character varying(500) NOT NULL,
    "MediaType" character varying(20) NOT NULL,
    "ThumbnailUrl" character varying(500),
    "Caption" character varying(500),
    "VoteCount" integer DEFAULT 0,
    "Rank" integer,
    "IsWinner" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "IsDeleted" boolean DEFAULT false
);


ALTER TABLE public."EventSubmission" OWNER TO pawnder_user;

--
-- TOC entry 275 (class 1259 OID 17186)
-- Name: EventSubmission_SubmissionId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."EventSubmission_SubmissionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EventSubmission_SubmissionId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3887 (class 0 OID 0)
-- Dependencies: 275
-- Name: EventSubmission_SubmissionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."EventSubmission_SubmissionId_seq" OWNED BY public."EventSubmission"."SubmissionId";


--
-- TOC entry 278 (class 1259 OID 17225)
-- Name: EventVote; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."EventVote" (
    "VoteId" integer NOT NULL,
    "SubmissionId" integer NOT NULL,
    "UserId" integer NOT NULL,
    "CreatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."EventVote" OWNER TO pawnder_user;

--
-- TOC entry 277 (class 1259 OID 17224)
-- Name: EventVote_VoteId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."EventVote_VoteId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."EventVote_VoteId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3888 (class 0 OID 0)
-- Dependencies: 277
-- Name: EventVote_VoteId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."EventVote_VoteId_seq" OWNED BY public."EventVote"."VoteId";


--
-- TOC entry 243 (class 1259 OID 16640)
-- Name: ExpertConfirmation; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."ExpertConfirmation" (
    "ExpertId" integer NOT NULL,
    "UserId" integer NOT NULL,
    "ChatAIId" integer NOT NULL,
    "UserQuestion" text,
    "Status" character varying(50),
    "Message" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."ExpertConfirmation" OWNER TO pawnder_user;

--
-- TOC entry 254 (class 1259 OID 16782)
-- Name: Notification; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Notification" (
    "NotificationId" integer NOT NULL,
    "UserId" integer,
    "Title" character varying(200),
    "Message" text,
    "Type" character varying(50),
    "IsRead" boolean DEFAULT false,
    "ReferenceId" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now(),
    "Status" character varying(20) DEFAULT 'SENT'::character varying,
    "IsBroadcast" boolean DEFAULT false,
    "SentAt" timestamp without time zone,
    "CreatedByUserId" integer,
    CONSTRAINT "Notification_Status_check" CHECK ((("Status")::text = ANY ((ARRAY['DRAFT'::character varying, 'SENT'::character varying])::text[])))
);


ALTER TABLE public."Notification" OWNER TO pawnder_user;

--
-- TOC entry 253 (class 1259 OID 16781)
-- Name: Notification_NotificationId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Notification_NotificationId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_NotificationId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3889 (class 0 OID 0)
-- Dependencies: 253
-- Name: Notification_NotificationId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Notification_NotificationId_seq" OWNED BY public."Notification"."NotificationId";


--
-- TOC entry 252 (class 1259 OID 16767)
-- Name: PaymentHistory; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PaymentHistory" (
    "HistoryId" integer NOT NULL,
    "UserId" integer,
    "StatusService" character varying(100),
    "StartDate" date,
    "EndDate" date,
    "Amount" numeric(10,2),
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PaymentHistory" OWNER TO pawnder_user;

--
-- TOC entry 251 (class 1259 OID 16766)
-- Name: PaymentHistory_HistoryId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PaymentHistory_HistoryId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PaymentHistory_HistoryId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3890 (class 0 OID 0)
-- Dependencies: 251
-- Name: PaymentHistory_HistoryId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PaymentHistory_HistoryId_seq" OWNED BY public."PaymentHistory"."HistoryId";


--
-- TOC entry 235 (class 1259 OID 16541)
-- Name: Pet; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Pet" (
    "PetId" integer NOT NULL,
    "UserId" integer,
    "Name" character varying(100),
    "Breed" character varying(100),
    "Gender" character varying(10),
    "Age" integer,
    "IsActive" boolean DEFAULT false,
    "IsDeleted" boolean DEFAULT false,
    "Description" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Pet" OWNER TO pawnder_user;

--
-- TOC entry 272 (class 1259 OID 17081)
-- Name: PetAppointment; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PetAppointment" (
    "AppointmentId" integer NOT NULL,
    "MatchId" integer NOT NULL,
    "InviterPetId" integer NOT NULL,
    "InviteePetId" integer NOT NULL,
    "InviterUserId" integer NOT NULL,
    "InviteeUserId" integer NOT NULL,
    "AppointmentDateTime" timestamp without time zone NOT NULL,
    "LocationId" integer,
    "ActivityType" character varying(50) NOT NULL,
    "Status" character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    "CurrentDecisionUserId" integer,
    "CounterOfferCount" integer DEFAULT 0,
    "InviterCheckedIn" boolean DEFAULT false,
    "InviteeCheckedIn" boolean DEFAULT false,
    "InviterCheckInTime" timestamp without time zone,
    "InviteeCheckInTime" timestamp without time zone,
    "CancelledBy" integer,
    "CancelReason" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PetAppointment" OWNER TO pawnder_user;

--
-- TOC entry 270 (class 1259 OID 17064)
-- Name: PetAppointmentLocation; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PetAppointmentLocation" (
    "LocationId" integer NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Address" text NOT NULL,
    "Latitude" numeric(9,6) NOT NULL,
    "Longitude" numeric(9,6) NOT NULL,
    "City" character varying(100),
    "District" character varying(100),
    "IsPetFriendly" boolean DEFAULT true,
    "PlaceType" character varying(50),
    "GooglePlaceId" character varying(255),
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PetAppointmentLocation" OWNER TO pawnder_user;

--
-- TOC entry 269 (class 1259 OID 17063)
-- Name: PetAppointmentLocation_LocationId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PetAppointmentLocation_LocationId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PetAppointmentLocation_LocationId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3891 (class 0 OID 0)
-- Dependencies: 269
-- Name: PetAppointmentLocation_LocationId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PetAppointmentLocation_LocationId_seq" OWNED BY public."PetAppointmentLocation"."LocationId";


--
-- TOC entry 271 (class 1259 OID 17080)
-- Name: PetAppointment_AppointmentId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PetAppointment_AppointmentId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PetAppointment_AppointmentId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3892 (class 0 OID 0)
-- Dependencies: 271
-- Name: PetAppointment_AppointmentId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PetAppointment_AppointmentId_seq" OWNED BY public."PetAppointment"."AppointmentId";


--
-- TOC entry 238 (class 1259 OID 16583)
-- Name: PetCharacteristic; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PetCharacteristic" (
    "PetId" integer NOT NULL,
    "AttributeId" integer NOT NULL,
    "OptionId" integer,
    "Value" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PetCharacteristic" OWNER TO pawnder_user;

--
-- TOC entry 274 (class 1259 OID 17161)
-- Name: PetEvent; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PetEvent" (
    "EventId" integer NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Description" text,
    "CoverImageUrl" character varying(500),
    "StartTime" timestamp without time zone NOT NULL,
    "SubmissionDeadline" timestamp without time zone NOT NULL,
    "EndTime" timestamp without time zone NOT NULL,
    "Status" character varying(30) DEFAULT 'upcoming'::character varying,
    "PrizeDescription" text,
    "PrizePoints" integer DEFAULT 0,
    "CreatedBy" integer NOT NULL,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PetEvent" OWNER TO pawnder_user;

--
-- TOC entry 273 (class 1259 OID 17160)
-- Name: PetEvent_EventId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PetEvent_EventId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PetEvent_EventId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3893 (class 0 OID 0)
-- Dependencies: 273
-- Name: PetEvent_EventId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PetEvent_EventId_seq" OWNED BY public."PetEvent"."EventId";


--
-- TOC entry 237 (class 1259 OID 16560)
-- Name: PetPhoto; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PetPhoto" (
    "PhotoId" integer NOT NULL,
    "PetId" integer NOT NULL,
    "ImageUrl" text NOT NULL,
    "PublicId" text,
    "IsPrimary" boolean DEFAULT false,
    "SortOrder" integer DEFAULT 0,
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."PetPhoto" OWNER TO pawnder_user;

--
-- TOC entry 236 (class 1259 OID 16559)
-- Name: PetPhoto_PhotoId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PetPhoto_PhotoId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PetPhoto_PhotoId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3894 (class 0 OID 0)
-- Dependencies: 236
-- Name: PetPhoto_PhotoId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PetPhoto_PhotoId_seq" OWNED BY public."PetPhoto"."PhotoId";


--
-- TOC entry 234 (class 1259 OID 16540)
-- Name: Pet_PetId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Pet_PetId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Pet_PetId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3895 (class 0 OID 0)
-- Dependencies: 234
-- Name: Pet_PetId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Pet_PetId_seq" OWNED BY public."Pet"."PetId";


--
-- TOC entry 264 (class 1259 OID 16885)
-- Name: Policy; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Policy" (
    "PolicyId" integer NOT NULL,
    "PolicyCode" character varying(50) NOT NULL,
    "PolicyName" character varying(200) NOT NULL,
    "Description" text,
    "DisplayOrder" integer DEFAULT 0,
    "RequireConsent" boolean DEFAULT true,
    "IsActive" boolean DEFAULT true,
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Policy" OWNER TO pawnder_user;

--
-- TOC entry 3896 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE "Policy"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON TABLE public."Policy" IS 'Bảng chính lưu thông tin Policy (Chính sách)';


--
-- TOC entry 3897 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN "Policy"."PolicyCode"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."Policy"."PolicyCode" IS 'Mã định danh duy nhất (TERMS_OF_SERVICE, PRIVACY_POLICY)';


--
-- TOC entry 3898 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN "Policy"."PolicyName"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."Policy"."PolicyName" IS 'Tên hiển thị của Policy';


--
-- TOC entry 3899 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN "Policy"."RequireConsent"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."Policy"."RequireConsent" IS 'Policy có yêu cầu user xác nhận không';


--
-- TOC entry 3900 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN "Policy"."IsActive"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."Policy"."IsActive" IS 'Policy có đang active không';


--
-- TOC entry 266 (class 1259 OID 16907)
-- Name: PolicyVersion; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."PolicyVersion" (
    "PolicyVersionId" integer NOT NULL,
    "PolicyId" integer NOT NULL,
    "VersionNumber" integer NOT NULL,
    "Title" character varying(300) NOT NULL,
    "Content" text NOT NULL,
    "ChangeLog" text,
    "Status" character varying(20) DEFAULT 'DRAFT'::character varying,
    "PublishedAt" timestamp without time zone,
    "DeactivatedAt" timestamp without time zone,
    "CreatedByUserId" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT "PolicyVersion_Status_check" CHECK ((("Status")::text = ANY ((ARRAY['DRAFT'::character varying, 'ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


ALTER TABLE public."PolicyVersion" OWNER TO pawnder_user;

--
-- TOC entry 3901 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE "PolicyVersion"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON TABLE public."PolicyVersion" IS 'Bảng lưu các phiên bản của Policy';


--
-- TOC entry 3902 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN "PolicyVersion"."VersionNumber"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."PolicyVersion"."VersionNumber" IS 'Số version (1, 2, 3...)';


--
-- TOC entry 3903 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN "PolicyVersion"."ChangeLog"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."PolicyVersion"."ChangeLog" IS 'Tóm tắt những thay đổi so với version trước';


--
-- TOC entry 3904 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN "PolicyVersion"."Status"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."PolicyVersion"."Status" IS 'Trạng thái: DRAFT, ACTIVE, INACTIVE';


--
-- TOC entry 265 (class 1259 OID 16906)
-- Name: PolicyVersion_PolicyVersionId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."PolicyVersion_PolicyVersionId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PolicyVersion_PolicyVersionId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3905 (class 0 OID 0)
-- Dependencies: 265
-- Name: PolicyVersion_PolicyVersionId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."PolicyVersion_PolicyVersionId_seq" OWNED BY public."PolicyVersion"."PolicyVersionId";


--
-- TOC entry 263 (class 1259 OID 16884)
-- Name: Policy_PolicyId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Policy_PolicyId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Policy_PolicyId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3906 (class 0 OID 0)
-- Dependencies: 263
-- Name: Policy_PolicyId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Policy_PolicyId_seq" OWNED BY public."Policy"."PolicyId";


--
-- TOC entry 249 (class 1259 OID 16726)
-- Name: Report; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Report" (
    "ReportId" integer NOT NULL,
    "UserReportId" integer,
    "ContentId" integer,
    "Reason" text,
    "Status" character varying(50),
    "Resolution" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Report" OWNER TO pawnder_user;

--
-- TOC entry 248 (class 1259 OID 16725)
-- Name: Report_ReportId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Report_ReportId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Report_ReportId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3907 (class 0 OID 0)
-- Dependencies: 248
-- Name: Report_ReportId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Report_ReportId_seq" OWNED BY public."Report"."ReportId";


--
-- TOC entry 220 (class 1259 OID 16397)
-- Name: Role; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."Role" (
    "RoleId" integer NOT NULL,
    "RoleName" character varying(50) NOT NULL,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Role" OWNER TO pawnder_user;

--
-- TOC entry 219 (class 1259 OID 16396)
-- Name: Role_RoleId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."Role_RoleId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_RoleId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3908 (class 0 OID 0)
-- Dependencies: 219
-- Name: Role_RoleId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."Role_RoleId_seq" OWNED BY public."Role"."RoleId";


--
-- TOC entry 226 (class 1259 OID 16432)
-- Name: User; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."User" (
    "UserId" integer NOT NULL,
    "RoleId" integer,
    "UserStatusId" integer,
    "AddressId" integer,
    "FullName" character varying(100),
    "Gender" character varying(10),
    "Email" character varying(150) NOT NULL,
    "PasswordHash" text NOT NULL,
    "ProviderLogin" character varying(50),
    "TokenJWT" text,
    "IsDeleted" boolean DEFAULT false,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now(),
    "IsProfileComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."User" OWNER TO pawnder_user;

--
-- TOC entry 228 (class 1259 OID 16466)
-- Name: UserBanHistory; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."UserBanHistory" (
    "BanId" integer NOT NULL,
    "UserId" integer NOT NULL,
    "BanStart" timestamp without time zone DEFAULT now() NOT NULL,
    "BanEnd" timestamp without time zone,
    "BanReason" text,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now(),
    "IsActive" boolean DEFAULT true
);


ALTER TABLE public."UserBanHistory" OWNER TO pawnder_user;

--
-- TOC entry 227 (class 1259 OID 16465)
-- Name: UserBanHistory_BanId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."UserBanHistory_BanId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserBanHistory_BanId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3909 (class 0 OID 0)
-- Dependencies: 227
-- Name: UserBanHistory_BanId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."UserBanHistory_BanId_seq" OWNED BY public."UserBanHistory"."BanId";


--
-- TOC entry 268 (class 1259 OID 16939)
-- Name: UserPolicyAccept; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."UserPolicyAccept" (
    "AcceptId" bigint NOT NULL,
    "UserId" integer NOT NULL,
    "PolicyVersionId" integer NOT NULL,
    "AcceptedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "IsValid" boolean DEFAULT true,
    "InvalidatedAt" timestamp without time zone,
    "CreatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."UserPolicyAccept" OWNER TO pawnder_user;

--
-- TOC entry 3910 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE "UserPolicyAccept"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON TABLE public."UserPolicyAccept" IS 'Bảng lưu lịch sử xác nhận Policy của User (Audit log - không được xóa/sửa)';


--
-- TOC entry 3911 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN "UserPolicyAccept"."AcceptedAt"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."UserPolicyAccept"."AcceptedAt" IS 'Thời điểm user xác nhận';


--
-- TOC entry 3912 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN "UserPolicyAccept"."IsValid"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."UserPolicyAccept"."IsValid" IS 'Có còn hiệu lực không (false khi policy đổi version mới)';


--
-- TOC entry 3913 (class 0 OID 0)
-- Dependencies: 268
-- Name: COLUMN "UserPolicyAccept"."InvalidatedAt"; Type: COMMENT; Schema: public; Owner: pawnder_user
--

COMMENT ON COLUMN public."UserPolicyAccept"."InvalidatedAt" IS 'Ngày accept này bị vô hiệu (khi có version mới)';


--
-- TOC entry 267 (class 1259 OID 16938)
-- Name: UserPolicyAccept_AcceptId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."UserPolicyAccept_AcceptId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserPolicyAccept_AcceptId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3914 (class 0 OID 0)
-- Dependencies: 267
-- Name: UserPolicyAccept_AcceptId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."UserPolicyAccept_AcceptId_seq" OWNED BY public."UserPolicyAccept"."AcceptId";


--
-- TOC entry 233 (class 1259 OID 16516)
-- Name: UserPreference; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."UserPreference" (
    "UserId" integer NOT NULL,
    "AttributeId" integer NOT NULL,
    "OptionId" integer,
    "MaxValue" integer,
    "MinValue" integer,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."UserPreference" OWNER TO pawnder_user;

--
-- TOC entry 222 (class 1259 OID 16408)
-- Name: UserStatus; Type: TABLE; Schema: public; Owner: pawnder_user
--

CREATE TABLE public."UserStatus" (
    "UserStatusId" integer NOT NULL,
    "UserStatusName" character varying(50) NOT NULL,
    "CreatedAt" timestamp without time zone DEFAULT now(),
    "UpdatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public."UserStatus" OWNER TO pawnder_user;

--
-- TOC entry 221 (class 1259 OID 16407)
-- Name: UserStatus_UserStatusId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."UserStatus_UserStatusId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserStatus_UserStatusId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3915 (class 0 OID 0)
-- Dependencies: 221
-- Name: UserStatus_UserStatusId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."UserStatus_UserStatusId_seq" OWNED BY public."UserStatus"."UserStatusId";


--
-- TOC entry 225 (class 1259 OID 16431)
-- Name: User_UserId_seq; Type: SEQUENCE; Schema: public; Owner: pawnder_user
--

CREATE SEQUENCE public."User_UserId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_UserId_seq" OWNER TO pawnder_user;

--
-- TOC entry 3916 (class 0 OID 0)
-- Dependencies: 225
-- Name: User_UserId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pawnder_user
--

ALTER SEQUENCE public."User_UserId_seq" OWNED BY public."User"."UserId";


--
-- TOC entry 3386 (class 2604 OID 16422)
-- Name: Address AddressId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Address" ALTER COLUMN "AddressId" SET DEFAULT nextval('public."Address_AddressId_seq"'::regclass);


--
-- TOC entry 3399 (class 2604 OID 16490)
-- Name: Attribute AttributeId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Attribute" ALTER COLUMN "AttributeId" SET DEFAULT nextval('public."Attribute_AttributeId_seq"'::regclass);


--
-- TOC entry 3404 (class 2604 OID 16503)
-- Name: AttributeOption OptionId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."AttributeOption" ALTER COLUMN "OptionId" SET DEFAULT nextval('public."AttributeOption_OptionId_seq"'::regclass);


--
-- TOC entry 3462 (class 2604 OID 16871)
-- Name: BadWord BadWordId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."BadWord" ALTER COLUMN "BadWordId" SET DEFAULT nextval('public."BadWord_BadWordId_seq"'::regclass);


--
-- TOC entry 3423 (class 2604 OID 16611)
-- Name: ChatAI ChatAIId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAI" ALTER COLUMN "ChatAIId" SET DEFAULT nextval('public."ChatAI_ChatAIId_seq"'::regclass);


--
-- TOC entry 3427 (class 2604 OID 16627)
-- Name: ChatAIContent ContentId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAIContent" ALTER COLUMN "ContentId" SET DEFAULT nextval('public."ChatAIContent_ContentId_seq"'::regclass);


--
-- TOC entry 3456 (class 2604 OID 16823)
-- Name: ChatExpert ChatExpertId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpert" ALTER COLUMN "ChatExpertId" SET DEFAULT nextval('public."ChatExpert_ChatExpertId_seq"'::regclass);


--
-- TOC entry 3459 (class 2604 OID 16843)
-- Name: ChatExpertContent ContentId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpertContent" ALTER COLUMN "ContentId" SET DEFAULT nextval('public."ChatExpertContent_ContentId_seq"'::regclass);


--
-- TOC entry 3432 (class 2604 OID 16671)
-- Name: ChatUser MatchId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser" ALTER COLUMN "MatchId" SET DEFAULT nextval('public."ChatUser_MatchId_seq"'::regclass);


--
-- TOC entry 3436 (class 2604 OID 16702)
-- Name: ChatUserContent ContentId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUserContent" ALTER COLUMN "ContentId" SET DEFAULT nextval('public."ChatUserContent_ContentId_seq"'::regclass);


--
-- TOC entry 3453 (class 2604 OID 16803)
-- Name: DailyLimit LimitId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."DailyLimit" ALTER COLUMN "LimitId" SET DEFAULT nextval('public."DailyLimit_LimitId_seq"'::regclass);


--
-- TOC entry 3498 (class 2604 OID 17190)
-- Name: EventSubmission SubmissionId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission" ALTER COLUMN "SubmissionId" SET DEFAULT nextval('public."EventSubmission_SubmissionId_seq"'::regclass);


--
-- TOC entry 3503 (class 2604 OID 17228)
-- Name: EventVote VoteId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventVote" ALTER COLUMN "VoteId" SET DEFAULT nextval('public."EventVote_VoteId_seq"'::regclass);


--
-- TOC entry 3447 (class 2604 OID 16785)
-- Name: Notification NotificationId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN "NotificationId" SET DEFAULT nextval('public."Notification_NotificationId_seq"'::regclass);


--
-- TOC entry 3444 (class 2604 OID 16770)
-- Name: PaymentHistory HistoryId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PaymentHistory" ALTER COLUMN "HistoryId" SET DEFAULT nextval('public."PaymentHistory_HistoryId_seq"'::regclass);


--
-- TOC entry 3410 (class 2604 OID 16544)
-- Name: Pet PetId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Pet" ALTER COLUMN "PetId" SET DEFAULT nextval('public."Pet_PetId_seq"'::regclass);


--
-- TOC entry 3486 (class 2604 OID 17084)
-- Name: PetAppointment AppointmentId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment" ALTER COLUMN "AppointmentId" SET DEFAULT nextval('public."PetAppointment_AppointmentId_seq"'::regclass);


--
-- TOC entry 3482 (class 2604 OID 17067)
-- Name: PetAppointmentLocation LocationId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointmentLocation" ALTER COLUMN "LocationId" SET DEFAULT nextval('public."PetAppointmentLocation_LocationId_seq"'::regclass);


--
-- TOC entry 3493 (class 2604 OID 17164)
-- Name: PetEvent EventId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetEvent" ALTER COLUMN "EventId" SET DEFAULT nextval('public."PetEvent_EventId_seq"'::regclass);


--
-- TOC entry 3415 (class 2604 OID 16563)
-- Name: PetPhoto PhotoId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetPhoto" ALTER COLUMN "PhotoId" SET DEFAULT nextval('public."PetPhoto_PhotoId_seq"'::regclass);


--
-- TOC entry 3467 (class 2604 OID 16888)
-- Name: Policy PolicyId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Policy" ALTER COLUMN "PolicyId" SET DEFAULT nextval('public."Policy_PolicyId_seq"'::regclass);


--
-- TOC entry 3474 (class 2604 OID 16910)
-- Name: PolicyVersion PolicyVersionId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PolicyVersion" ALTER COLUMN "PolicyVersionId" SET DEFAULT nextval('public."PolicyVersion_PolicyVersionId_seq"'::regclass);


--
-- TOC entry 3439 (class 2604 OID 16729)
-- Name: Report ReportId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Report" ALTER COLUMN "ReportId" SET DEFAULT nextval('public."Report_ReportId_seq"'::regclass);


--
-- TOC entry 3380 (class 2604 OID 16400)
-- Name: Role RoleId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Role" ALTER COLUMN "RoleId" SET DEFAULT nextval('public."Role_RoleId_seq"'::regclass);


--
-- TOC entry 3389 (class 2604 OID 16435)
-- Name: User UserId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User" ALTER COLUMN "UserId" SET DEFAULT nextval('public."User_UserId_seq"'::regclass);


--
-- TOC entry 3394 (class 2604 OID 16469)
-- Name: UserBanHistory BanId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserBanHistory" ALTER COLUMN "BanId" SET DEFAULT nextval('public."UserBanHistory_BanId_seq"'::regclass);


--
-- TOC entry 3478 (class 2604 OID 16942)
-- Name: UserPolicyAccept AcceptId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPolicyAccept" ALTER COLUMN "AcceptId" SET DEFAULT nextval('public."UserPolicyAccept_AcceptId_seq"'::regclass);


--
-- TOC entry 3383 (class 2604 OID 16411)
-- Name: UserStatus UserStatusId; Type: DEFAULT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserStatus" ALTER COLUMN "UserStatusId" SET DEFAULT nextval('public."UserStatus_UserStatusId_seq"'::regclass);


--
-- TOC entry 3812 (class 0 OID 16419)
-- Dependencies: 224
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Address" ("AddressId", "Latitude", "Longitude", "FullAddress", "City", "District", "Ward", "CreatedAt", "UpdatedAt") FROM stdin;
2	10.030695	105.768738	3/2 Street, Xuân Khánh, Ninh Kiều	Cần Thơ	Ninh Kiều	Xuân Khánh	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	20.957090	105.770328	Khu đô thị Văn Phú, Phường Kiến Hưng, Hà Nội, 10189, Vietnam	Hà Nội	Phường Kiến Hưng	\N	2026-01-08 10:50:58.596988	2026-01-08 10:50:58.597011
4	20.957090	105.770328	Khu đô thị Văn Phú, Phường Kiến Hưng, Hà Nội, 10189, Vietnam	Hà Nội	Phường Kiến Hưng	\N	2026-01-08 10:57:59.469456	2026-01-08 10:57:59.46946
16	20.993837	105.831240	Ngõ 198 Phố Lê Trọng Tấn, Phuong Liet Ward, Hà Nội, 11412, Vietnam	Hà Nội	Phuong Liet	\N	2026-01-20 08:16:27.75576	2026-01-23 18:59:58.79802
17	21.006693	105.835633	Trường Mầm non Kim Liên, 19, Hoang Tich Tri Street, Khu tập thể Kim Liên, Kim Lien Ward, Hà Nội, 11520, Vietnam	Hà Nội	Kim Lien	\N	2026-01-20 08:16:27.75576	2026-01-23 19:00:42.846302
1	20.989157	105.795657	Hanoi University, Km 9, Đường Nguyễn Trãi, Dai Mo Ward, Hà Nội, 12011, Vietnam	Hà Nội	Dai Mo	\N	2026-01-05 13:46:27.838373	2026-01-23 15:11:10.667587
26	21.028511	105.804817	123 Hoàng Quốc Việt, Nghĩa Đô, Cầu Giấy	Hà Nội	Cầu Giấy	Nghĩa Đô	2026-01-23 17:55:48.073102	2026-01-23 17:55:48.073102
29	21.033333	105.849998	321 Nguyễn Văn Cừ, Gia Thụy, Long Biên	Hà Nội	Long Biên	Gia Thụy	2026-01-23 17:55:48.073102	2026-01-23 17:55:48.073102
27	21.017963	103.000000	416 Láng Hạ, Thành Công, Đống Đa	Hà Nội	Đống Đa	Thành Công	2026-01-23 17:55:48.073102	2026-01-23 17:55:48.073102
18	20.980122	105.802612	Trường Mầm non xã Tân Triều, Ngách 10 Ngõ 83 Tân Triều, Thanh Liet Ward, Hà Nội, 10135, Vietnam	Hà Nội	Thanh Liet	\N	2026-01-20 08:16:27.75576	2026-01-23 19:02:01.82715
30	20.980372	105.744447	Đường Lê Trọng Tấn, Duong Noi Ward, Hà Nội, 10189, Vietnam	Hà Nội	Duong Noi	\N	2026-01-23 17:55:48.073102	2026-01-23 19:04:14.939062
15	21.033645	105.762783	Trường Mầm non Cầu Diễn, Ngõ 68 Phố Lưu Hữu Phước, Khu đô thị Mỹ Đình 1, Tu Liem Ward, Hà Nội, 10085, Vietnam	Hà Nội	Tu Liem	\N	2026-01-20 08:16:27.75576	2026-01-23 18:41:13.187735
28	20.007500	99.862100	789 Trần Duy Hưng, Trung Hòa, Cầu Giấy	Hà Nội	Cầu Giấy	Trung Hòa	2026-01-23 17:55:48.073102	2026-01-23 17:55:48.073102
14	21.001880	105.856175	Ngõ 167 Phố Thanh Nhàn, Bach Mai Ward, Hà Nội, 11618, Vietnam	Hà Nội	Bach Mai	\N	2026-01-20 08:16:27.75576	2026-01-23 18:57:39.806957
12	21.111407	105.864278	Dong Anh Commune, Hà Nội, 12323, Vietnam	Hà Nội	Dong Anh	\N	2026-01-20 08:16:27.75576	2026-01-23 19:08:27.081754
13	21.180655	105.707652	Me Linh Commune, Hà Nội, 12910, Vietnam	Hà Nội	Me Linh	\N	2026-01-20 08:16:27.75576	2026-01-23 19:12:55.35015
\.


--
-- TOC entry 3818 (class 0 OID 16487)
-- Dependencies: 230
-- Data for Name: Attribute; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Attribute" ("AttributeId", "Name", "TypeValue", "Unit", "Percent", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
1	Hình dạng đầu	string	\N	9.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	Hình dạng mõm	string	\N	7.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	Màu lông	string	\N	9.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
4	Độ dài lông	string	\N	6.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
5	Kiểu lông	string	\N	6.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
6	Cân nặng	float	kg	8.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
7	Kích thước mắt	string	\N	7.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
8	Màu mắt	string	\N	6.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
9	Hình dạng tai	string	\N	7.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
10	Hình dạng đuôi	string	\N	4.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
11	Tỷ lệ chân – thân	string	\N	3.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
12	Trạng thái cơ thể	string	\N	2.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
13	Tuổi	float	năm	2.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
15	Giới tính	string	\N	2.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
16	Khoảng cách	float	km	5.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
17	Chiều cao	float	cm	5.00	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
14	Loại	string	\N	2.00	t	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
\.


--
-- TOC entry 3820 (class 0 OID 16500)
-- Dependencies: 232
-- Data for Name: AttributeOption; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."AttributeOption" ("OptionId", "AttributeId", "Name", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
1	1	Tròn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	1	Cân đối	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	1	Dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
4	1	Vuông	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
5	2	Ngắn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
6	2	Trung bình	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
7	2	Dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
8	3	Trắng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
9	3	Vàng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
10	3	Nâu	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
11	3	Đen	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
12	3	Xám	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
13	3	Đỏ	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
14	3	Bạc	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
15	3	Xanh	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
16	3	Đốm	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
17	4	Ngắn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
18	4	Trung bình	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
19	4	Dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
20	5	Mượt	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
21	5	Xoăn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
22	5	Xù	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
23	5	Không lông	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
24	7	Rất to	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
25	7	To	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
26	7	Trung bình	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
27	7	Nhỏ	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
28	8	Đen	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
29	8	Nâu	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
30	8	Vàng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
31	8	Xanh dương	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
32	8	Xanh lá	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
33	8	Hổ phách	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
34	9	Dựng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
35	9	Cụp	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
36	9	Cụp một phần	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
37	9	Dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
38	9	Ngắn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
39	9	Tròn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
40	10	Thẳng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
41	10	Cong nhẹ	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
42	10	Cong tròn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
43	10	Dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
44	10	Cụt	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
45	11	Chân rất ngắn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
46	11	Chân ngắn	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
47	11	Cân đối	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
48	11	Chân dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
49	11	Chân rất dài	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
50	12	Gầy	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
51	12	Săn chắc	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
52	12	Cân đối	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
53	12	Mũm mĩm	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
54	12	Béo	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
55	15	Đực	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
56	15	Cái	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
\.


--
-- TOC entry 3850 (class 0 OID 16868)
-- Dependencies: 262
-- Data for Name: BadWord; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."BadWord" ("BadWordId", "Word", "IsRegex", "Level", "Category", "IsActive", "CreatedAt", "UpdatedAt") FROM stdin;
5	đụ	f	2	Thô tục	t	2026-01-06 15:13:33.268036	2026-01-06 15:13:33.268036
1	đm	f	1	Thô tục	t	2026-01-06 15:13:33.268036	2026-01-08 14:23:29.82655
9	dm	f	1	Thô tục	t	2026-01-08 14:34:29.181604	2026-01-08 14:34:29.181604
6	lừa đảo	f	2	Scam	t	2026-01-06 15:13:33.268036	2026-01-11 14:00:49.482599
7	chuyển tiền	f	2	Scam	t	2026-01-06 15:13:33.268036	2026-01-11 14:00:54.300437
11	Scam	f	2	Thô tục	t	2026-01-13 16:42:04.367936	2026-01-13 16:42:04.367936
3	vl	f	1	Thô tục	t	2026-01-06 15:13:33.268036	2026-01-13 16:47:21.894164
4	địt	f	2	Thô tục	t	2026-01-06 15:13:33.268036	2026-01-15 11:22:02.316534
\.


--
-- TOC entry 3838 (class 0 OID 16747)
-- Dependencies: 250
-- Data for Name: Block; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Block" ("FromUserId", "ToUserId", "CreatedAt", "UpdatedAt") FROM stdin;
\.


--
-- TOC entry 3828 (class 0 OID 16608)
-- Dependencies: 240
-- Data for Name: ChatAI; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatAI" ("ChatAIId", "UserId", "Title", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
1	3	Tư vấn giống chó phù hợp	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	4	Phân tích gen thú cưng	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	4	Mèo tôi 2 tuổi, rụng lông nhiều. \nNguyên nhân v...	f	2026-01-21 10:38:42.272017	2026-01-21 10:39:18.268469
4	14	Meo rung long	f	2026-01-23 15:40:01.632884	2026-01-24 06:06:33.627784
5	15	xin chao	f	2026-01-24 06:18:43.375707	2026-01-24 06:18:50.074001
6	4	string	f	2026-01-28 03:58:05.23625	2026-01-28 03:58:26.959633
\.


--
-- TOC entry 3830 (class 0 OID 16624)
-- Dependencies: 242
-- Data for Name: ChatAIContent; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatAIContent" ("ContentId", "ChatAIId", "Question", "Answer", "CreatedAt", "UpdatedAt") FROM stdin;
1	1	Tôi muốn nuôi chó hiền, phù hợp trẻ nhỏ. Bạn có thể tư vấn giúp tôi không?	Chào bạn! Tôi rất vui được tư vấn cho bạn. Golden Retriever là một lựa chọn tuyệt vời cho gia đình có trẻ nhỏ vì chúng rất hiền lành, thân thiện và kiên nhẫn với trẻ em.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	1	Golden Retriever có cần không gian rộng không? Nhà tôi chỉ có sân nhỏ thôi.	Golden Retriever là giống chó lớn và năng động, chúng cần không gian để vận động. Tuy nhiên, nếu bạn có thể đưa chúng đi dạo hàng ngày ít nhất 30-60 phút và có sân nhỏ để chúng chơi, thì vẫn có thể nuôi được.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	1	Vậy còn giống nào khác phù hợp với không gian nhỏ hơn không?	Nếu không gian hạn chế, bạn có thể cân nhắc các giống nhỏ hơn như: Cavalier King Charles Spaniel (rất hiền và thích hợp với trẻ em), Beagle (vui vẻ, thân thiện), hoặc Poodle (thông minh, ít rụng lông).	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
4	1	Poodle có dễ chăm sóc không? Tôi nghe nói chúng cần cắt tỉa lông thường xuyên.	Đúng vậy, Poodle cần được cắt tỉa lông định kỳ khoảng 4-6 tuần một lần. Tuy nhiên, ưu điểm là chúng ít rụng lông, phù hợp với người bị dị ứng. Ngoài ra, Poodle rất thông minh và dễ huấn luyện, rất phù hợp với gia đình có trẻ nhỏ.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
5	1	Cảm ơn bạn! Vậy chi phí nuôi một chú chó như vậy khoảng bao nhiêu một tháng?	Chi phí nuôi chó phụ thuộc vào nhiều yếu tố. Ước tính hàng tháng: thức ăn (500k-1.5 triệu), chăm sóc sức khỏe (200k-500k), đồ chơi và phụ kiện (100k-300k), cắt tỉa lông (nếu cần, 200k-500k/tháng). Tổng cộng khoảng 1-2.5 triệu/tháng tùy giống và kích thước.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
6	1	Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn. Bạn có thể kết nối tôi với chuyên gia không?	Tất nhiên! Tôi sẽ gửi yêu cầu của bạn đến chuyên gia để họ xem xét và xác nhận lại thông tin. Chuyên gia sẽ đánh giá chi tiết hơn về từng giống chó và đưa ra lời khuyên phù hợp nhất với tình huống cụ thể của bạn.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
7	2	Con này có thể phối với giống nào tốt?	Phối với Labrador sẽ ra đời con khỏe và dễ huấn luyện.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
8	3	Mèo tôi 2 tuổi, rụng lông nhiều. \nNguyên nhân và cách khắc phục?	Chào bạn! 🐾 Việc mèo rụng lông là một phần tự nhiên, nhưng nếu mèo 2 tuổi của bạn rụng nhiều, có thể có vài nguyên nhân và cách khắc phục nhé:\n\nNguyên nhân thường gặp:\n*   Mùa thay lông: Thường xuyên vào mùa nóng hoặc khi thời tiết thay đổi.\n*   Dinh dưỡng: Chế độ ăn thiếu dưỡng chất, đặc biệt là axit béo omega.\n*   Stress: Môi trường sống thay đổi, hoặc mèo cảm thấy không thoải mái.\n*   Vấn đề sức khỏe: Ký sinh trùng (ve, rận), dị ứng, hoặc các bệnh về da.\n\nĐể giúp bé mèo của bạn:\n*   Chải lông hàng ngày: Rất quan trọng để loại bỏ lông rụng và kích thích da khỏe mạnh.\n*   Cải thiện dinh dưỡng: Chọn thức ăn chất lượng cao, bổ sung omega-3 và omega-6.\n*   Giảm stress: Tạo không gian an toàn, chơi đùa với mèo thường xuyên.\n*   Thăm khám bác sĩ thú y: Nếu rụng lông kèm theo ngứa, da đỏ, hoặc mèo có dấu hiệu mệt mỏi, hãy đưa bé đi kiểm tra ngay để loại trừ các vấn đề sức khỏe nhé.\n\nBạn cứ thử các cách trên và quan sát thêm bé mèo của mình nha! Chúc hai bạn luôn vui vẻ! ❤️	2026-01-21 10:38:58.864118	2026-01-21 10:38:58.864118
9	3	Nên cho ăn thức ăn gì?	Chào bạn! 😻 Thật tuyệt khi bạn quan tâm đến dinh dưỡng cho bé mèo cưng. Để giúp mèo giảm rụng lông và có bộ lông khỏe mạnh, bạn nên chú ý đến chất lượng thức ăn nhé.\n\nDưới đây là một vài gợi ý:\n\n*   Thức ăn hạt cao cấp: Chọn loại dành cho mèo trưởng thành, có ghi "complete and balanced" (hoàn chỉnh và cân bằng). Ưu tiên các sản phẩm có thành phần chính là thịt và cá, chứa nhiều protein.\n*   Thức ăn ướt: Bổ sung thêm thức ăn ướt (pate, súp) giúp mèo nhận đủ nước và tăng cường dưỡng chất.\n*   Bổ sung Omega-3 và Omega-6: Nhiều loại thức ăn chất lượng cao đã có sẵn các axit béo này, rất tốt cho da và lông. Bạn cũng có thể hỏi bác sĩ thú y về các loại dầu cá hoặc thực phẩm bổ sung an toàn.\n*   Thức ăn chuyên biệt: Một số thương hiệu có dòng sản phẩm hỗ trợ da và lông, bạn có thể tham khảo nhé.\n\nĐiều quan trọng là chọn thức ăn phù hợp với độ tuổi và tình trạng sức khỏe của mèo. Nếu bạn phân vân, đừng ngần ngại hỏi ý kiến bác sĩ thú y để có lời khuyên tốt nhất cho bé mèo nhà mình nhé! Chúc bé mèo của bạn luôn khỏe mạnh và có bộ lông óng mượt! ✨	2026-01-21 10:39:18.268469	2026-01-21 10:39:18.268469
10	4	Meo rung long	Chào bạn, Pawnder AI đây! 👋 Rụng lông là một trong những vấn đề mà rất nhiều sen quan tâm về các bé mèo cưng của mình đó. Đừng quá lo lắng nhé, một chút rụng lông là hoàn toàn bình thường và là một phần tự nhiên trong vòng đời của mèo đó!\n\nTuy nhiên, nếu bé rụng lông nhiều bất thường, có thể có vài nguyên nhân sau:\n*   Thay lông theo mùa: Mèo thường thay lông để thích nghi với thời tiết.\n*   Stress: Môi trường sống thay đổi, tiếng ồn có thể làm mèo rụng lông nhiều hơn.\n*   Dinh dưỡng: Chế độ ăn thiếu chất có thể ảnh hưởng đến sức khỏe của da và lông.\n*   Vấn đề sức khỏe: Đôi khi là dấu hiệu của dị ứng, ký sinh trùng hoặc bệnh da liễu.\n\nĐể giúp bé yêu của bạn, bạn có thể tham khảo các cách sau:\n*   Chải lông cho mèo thường xuyên: Giúp loại bỏ lông chết và kích thích lưu thông máu.\n*   Đảm bảo chế độ ăn chất lượng: Thức ăn giàu omega-3 và omega-6 rất tốt cho da và lông.\n*   Tạo môi trường thoải mái: Giảm stress cho mèo bằng cách giữ không gian yên tĩnh và an toàn.\n\nNếu mèo của bạn rụng lông quá nhiều kèm theo các dấu hiệu như ngứa ngáy, da bị đỏ, có mảng hói hoặc thay đổi hành vi, hãy đưa bé đến bác sĩ thú y để được kiểm tra và tư vấn kịp thời nhé! 🩺 Chúc bé mèo của bạn luôn có bộ lông óng mượt và khỏe mạnh! 💖	2026-01-23 15:40:14.463919	2026-01-23 15:40:14.463919
11	4	ok	Tuyệt vời! 👍 Rất vui là thông tin vừa rồi hữu ích cho bạn nha.\n\nNếu bạn có bất kỳ câu hỏi nào khác về bé mèo cưng của mình, dù là về hành vi, dinh dưỡng hay sức khỏe, đừng ngần ngại hỏi Pawnder AI nhé! Mình luôn sẵn lòng lắng nghe và chia sẻ. 😊	2026-01-23 16:07:32.108377	2026-01-23 16:07:32.108377
12	4	ok	Cảm ơn bạn nhé! Rất vui được đồng hành cùng bạn và bé mèo. 🐾\n\nHãy nhớ rằng Pawnder AI luôn ở đây bất cứ khi nào bạn cần thêm lời khuyên hay có bất kỳ thắc mắc nào về người bạn bốn chân của mình nha! Chúc bạn và bé mèo có những khoảnh khắc thật vui vẻ và hạnh phúc! ❤️	2026-01-23 16:14:43.145198	2026-01-23 16:14:43.145198
13	4	hi	Chào bạn! Pawnder AI đây, rất vui được gặp bạn! 👋 Bạn có câu hỏi nào về bé mèo cưng của mình không? Dù là về hành vi, dinh dưỡng, hay sức khỏe, mình luôn sẵn lòng lắng nghe và chia sẻ đó. 😊	2026-01-24 06:06:33.627784	2026-01-24 06:06:33.627784
14	5	xin chao	Chào bạn yêu mèo! 👋 Mình là Pawnder AI, trợ lý AI chuyên về chăm sóc mèo của ứng dụng Pawnder đây. Mình rất vui được đồng hành cùng bạn trên hành trình chăm sóc những người bạn bốn chân đáng yêu. 😻\n\nMình có thể hỗ trợ bạn về mọi thứ liên quan đến mèo cưng, từ sức khỏe, dinh dưỡng, hành vi cho đến huấn luyện và vệ sinh. Đừng ngần ngại chia sẻ bất kỳ câu hỏi hay thắc mắc nào bạn đang có nhé. Mình luôn sẵn lòng giúp đỡ để bạn và mèo cưng có một cuộc sống vui vẻ và hạnh phúc nhất! Bạn muốn hỏi mình điều gì không nè? 🐾	2026-01-24 06:18:50.074001	2026-01-24 06:18:50.074001
15	6	tao là đạt	Chào Đạt! Rất vui được làm quen với bạn nhé. Mình là Pawnder AI, trợ lý chuyên về chăm sóc mèo của ứng dụng Pawnder đây.\n\nMình ở đây để giúp bạn hiểu rõ hơn về người bạn bốn chân của mình, dù là chuyện sức khỏe, chế độ ăn, những hành vi khó hiểu hay cách để chúng luôn vui vẻ. Bạn có bất kỳ câu hỏi nào về mèo cưng không? Đừng ngần ngại chia sẻ nhé, mình luôn sẵn lòng lắng nghe và hỗ trợ bạn một cách tận tình nhất. Hãy kể cho mình nghe về bé mèo nhà bạn nào! 🐱🐾	2026-01-28 03:58:26.959633	2026-01-28 03:58:26.959633
\.


--
-- TOC entry 3846 (class 0 OID 16820)
-- Dependencies: 258
-- Data for Name: ChatExpert; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatExpert" ("ChatExpertId", "ExpertId", "UserId", "CreatedAt", "UpdatedAt") FROM stdin;
1	2	3	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	2	4	2026-01-13 16:52:06.52265	2026-01-13 16:52:06.522672
3	2	15	2026-01-24 06:20:22.998264	2026-01-24 06:20:22.998306
\.


--
-- TOC entry 3848 (class 0 OID 16840)
-- Dependencies: 260
-- Data for Name: ChatExpertContent; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatExpertContent" ("ContentId", "ChatExpertId", "FromId", "Message", "ExpertId", "UserId", "ChatAIId", "CreatedAt", "UpdatedAt") FROM stdin;
1	1	3	\N	2	3	1	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	1	3	Xin chào chuyên gia, tôi cần tư vấn về giống chó phù hợp.	\N	\N	\N	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	1	2	Chào bạn! Tôi đã xem qua yêu cầu của bạn. Golden Retriever thực sự là lựa chọn tốt cho gia đình có trẻ nhỏ.	\N	\N	\N	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
4	2	4	***	2	4	\N	2026-01-13 16:52:12.574338	2026-01-13 16:52:12.574338
5	2	4	Xin chao bac si	2	4	\N	2026-01-13 16:52:24.870319	2026-01-13 16:52:24.870319
6	3	15	xin chao	2	15	\N	2026-01-24 06:20:28.050555	2026-01-24 06:20:28.050555
7	3	2	chao ban	2	15	\N	2026-01-24 06:20:33.012828	2026-01-24 06:20:33.012828
\.


--
-- TOC entry 3833 (class 0 OID 16668)
-- Dependencies: 245
-- Data for Name: ChatUser; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatUser" ("MatchId", "FromPetId", "ToPetId", "FromUserId", "ToUserId", "Status", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
1	1	2	3	4	Accepted	f	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	2	18	4	14	Pending	t	2026-01-21 17:32:01.74123	2026-01-21 10:32:08.74082
3	2	18	4	14	Accepted	t	2026-01-21 17:32:22.442076	2026-01-21 10:39:38.373951
4	2	18	4	14	Accepted	t	2026-01-21 17:49:40.740234	2026-01-21 10:51:35.55458
5	2	18	4	14	Accepted	t	2026-01-21 17:51:47.676525	2026-01-21 10:55:22.042803
6	2	18	4	14	Accepted	t	2026-01-21 17:55:32.31689	2026-01-21 10:57:12.76751
7	18	2	14	4	Accepted	f	2026-01-23 06:46:43.511873	2026-01-23 06:46:47.21767
8	2	27	4	15	Pending	t	2026-01-24 13:08:02.230939	2026-01-24 06:08:16.771186
9	2	27	4	15	Pending	t	2026-01-24 13:08:28.624921	2026-01-24 06:08:33.685185
10	2	27	4	15	Accepted	f	2026-01-24 14:31:32.934327	2026-01-24 14:31:35.332484
\.


--
-- TOC entry 3835 (class 0 OID 16699)
-- Dependencies: 247
-- Data for Name: ChatUserContent; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ChatUserContent" ("ContentId", "MatchId", "FromUserId", "FromPetId", "Message", "CreatedAt", "UpdatedAt") FROM stdin;
1	1	3	1	Chào bạn, tôi muốn nhờ bạn tư vấn cho thú cưng của tôi!	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	1	4	2	Chào bạn, tôi rất sẵn lòng giúp!	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
5	1	3	1	***	2026-01-06 15:47:23.107916	2026-01-06 15:47:23.107916
7	1	4	2	ok	2026-01-07 15:53:27.133642	2026-01-07 15:53:27.133642
8	1	4	2	Dm	2026-01-07 17:12:07.60369	2026-01-07 17:12:07.60369
9	1	4	2	dm	2026-01-07 17:12:15.219746	2026-01-07 17:12:15.219746
10	1	4	2	***	2026-01-07 17:12:26.803732	2026-01-07 17:12:26.803732
11	1	4	2	***	2026-01-07 17:12:36.764784	2026-01-07 17:12:36.764784
12	1	4	2	***	2026-01-07 17:14:26.585527	2026-01-07 17:14:26.585527
13	1	4	2	***	2026-01-07 17:15:32.266093	2026-01-07 17:15:32.266093
14	1	4	2	***	2026-01-07 17:19:07.291	2026-01-07 17:19:07.291
15	1	4	2	***	2026-01-07 17:19:12.588246	2026-01-07 17:19:12.588246
16	1	4	2	dm	2026-01-07 17:19:16.25373	2026-01-07 17:19:16.25373
17	1	4	2	***	2026-01-07 17:19:22.288859	2026-01-07 17:19:22.288859
18	1	4	2	Tôi muốn gặp bạn ***	2026-01-07 19:07:07.130807	2026-01-07 19:07:07.130807
19	1	4	2	//.***//	2026-01-07 19:55:13.076797	2026-01-07 19:55:13.076797
20	1	4	2	***	2026-01-07 19:55:32.904186	2026-01-07 19:55:32.904186
21	1	4	2	đm	2026-01-07 19:55:49.009113	2026-01-07 19:55:49.009113
22	1	4	2	.///***//aa!	2026-01-08 14:23:09.189068	2026-01-08 14:23:09.189068
23	1	4	2	..***../â/a	2026-01-08 14:23:44.000523	2026-01-08 14:23:44.000523
24	1	4	2	.d/m	2026-01-08 14:23:50.284937	2026-01-08 14:23:50.284937
25	1	4	2	.d/m///a	2026-01-08 14:24:08.608674	2026-01-08 14:24:08.608674
26	1	4	2	Dm	2026-01-08 14:34:20.400802	2026-01-08 14:34:20.400802
27	1	4	2	***	2026-01-08 14:34:34.64181	2026-01-08 14:34:34.64181
28	1	4	2	Alo	2026-01-08 17:52:55.067512	2026-01-08 17:52:55.067512
29	1	3	1	alo	2026-01-09 10:04:02.426734	2026-01-09 10:04:02.426734
30	1	4	2	?	2026-01-09 14:56:11.856341	2026-01-09 14:56:11.856341
31	1	4	2	alo	2026-01-09 15:22:20.751655	2026-01-09 15:22:20.751655
32	1	4	2	alo	2026-01-09 15:23:27.530659	2026-01-09 15:23:27.530659
33	1	3	1	?	2026-01-09 15:23:55.522684	2026-01-09 15:23:55.522684
34	1	3	1	?	2026-01-09 15:24:01.718087	2026-01-09 15:24:01.718087
35	1	3	1	?	2026-01-09 15:24:10.225407	2026-01-09 15:24:10.225407
36	1	3	1	?	2026-01-09 15:24:16.217359	2026-01-09 15:24:16.217359
37	1	4	2	ok	2026-01-09 15:29:52.367479	2026-01-09 15:29:52.367479
38	1	4	2	ok	2026-01-09 15:29:57.261637	2026-01-09 15:29:57.261637
39	1	4	2	a	2026-01-09 15:30:00.265311	2026-01-09 15:30:00.265311
40	1	4	2	a	2026-01-09 15:30:10.839894	2026-01-09 15:30:10.839894
41	1	4	2	***	2026-01-09 15:30:27.770369	2026-01-09 15:30:27.770369
42	1	4	2	***	2026-01-09 15:30:44.617025	2026-01-09 15:30:44.617025
43	1	4	2	ok b	2026-01-09 15:31:05.615941	2026-01-09 15:31:05.615941
44	1	4	2	***	2026-01-13 16:48:43.061441	2026-01-13 16:48:43.061441
45	1	4	2	***	2026-01-13 16:48:53.322954	2026-01-13 16:48:53.322954
46	1	4	2	***	2026-01-13 16:49:02.959093	2026-01-13 16:49:02.959093
47	1	4	2	***	2026-01-13 16:50:28.564358	2026-01-13 16:50:28.564358
48	1	4	2	d 1m2	2026-01-13 16:51:17.256053	2026-01-13 16:51:17.256053
49	1	4	2	***	2026-01-14 13:29:37.449268	2026-01-14 13:29:37.449268
50	1	4	2	***	2026-01-14 13:31:36.701926	2026-01-14 13:31:36.701926
51	3	14	18	Chào bạn! Max trông đáng yêu quá! 🐱	2026-01-21 10:33:55.941969	2026-01-21 10:33:55.941969
52	3	4	2	Cảm ơn! Luna cũng xinh lắm nha 😊	2026-01-21 10:34:10.847155	2026-01-21 10:34:10.847155
53	3	4	2	"Cho 2 bé gặp nhau chơi không? \nPet Café Nguyễn Huệ thế nào?"	2026-01-21 10:34:39.678344	2026-01-21 10:34:39.678344
54	3	14	18	Ổn đấy! Khi nào bạn rảnh?	2026-01-21 10:34:52.843323	2026-01-21 10:34:52.843323
55	3	4	2	Có thể là cuối tuần	2026-01-21 10:35:12.568712	2026-01-21 10:35:12.568712
56	3	4	2	Hoặc là tối thứ 7 cũng được	2026-01-21 10:35:30.631703	2026-01-21 10:35:30.631703
57	7	4	2	Chào bạn! Max trông đáng yêu quá! 🐱	2026-01-23 06:47:22.875095	2026-01-23 06:47:22.875095
58	7	14	18	Cảm ơn! Luna cũng xinh lắm nha 😊	2026-01-23 06:47:31.501128	2026-01-23 06:47:31.501128
59	7	4	2	Cho 2 bé gặp nhau chơi không?	2026-01-23 06:47:43.870312	2026-01-23 06:47:43.870312
60	7	14	18	Pet Café Nguyễn Huệ thế nào?	2026-01-23 06:47:52.930941	2026-01-23 06:47:52.930941
61	7	4	2	Ổn đấy! Khi nào bạn rảnh?	2026-01-23 06:48:03.400868	2026-01-23 06:48:03.400868
62	7	14	18	Có thể là cuối tuần	2026-01-23 06:48:13.797735	2026-01-23 06:48:13.797735
63	7	14	18	Hoặc là tối thứ 7 cũng được	2026-01-23 06:48:38.039378	2026-01-23 06:48:38.039378
64	7	4	2	OK	2026-01-23 06:48:44.476264	2026-01-23 06:48:44.476264
65	7	14	18	Hoặc là tối thứ 7 cũng được	2026-01-23 06:48:48.654069	2026-01-23 06:48:48.654069
66	7	14	18	Hoặc là tối thứ 7 cũng được	2026-01-23 06:48:54.734243	2026-01-23 06:48:54.734243
67	7	14	18	Hoặc là tối thứ 7 cũng được	2026-01-23 06:49:10.180146	2026-01-23 06:49:10.180146
68	7	4	2	***	2026-01-23 07:39:59.044906	2026-01-23 07:39:59.044906
69	7	14	18	xin chao	2026-01-24 06:05:49.566935	2026-01-24 06:05:49.566935
70	7	4	2	ok	2026-01-24 06:05:58.170691	2026-01-24 06:05:58.170691
71	10	4	2	""Hi! Bé Max nhà mình 2 tuổi, đang tìm bạn gái nè 😄""	2026-01-24 07:32:05.571887	2026-01-24 07:32:05.571887
72	10	15	27	""Hi! Bé Max nhà mình 2 tuổi, đang tìm bạn gái nè 😄""	2026-01-24 07:32:28.94718	2026-01-24 07:32:28.94718
73	10	4	2	""Hi! Bé Max nhà mình 2 tuổi, đang tìm bạn gái nè 😄""	2026-01-24 07:32:34.695163	2026-01-24 07:32:34.695163
74	10	15	27	a	2026-01-24 07:32:39.45907	2026-01-24 07:32:39.45907
75	10	4	2	a	2026-01-24 07:32:40.90478	2026-01-24 07:32:40.90478
76	10	4	2	a	2026-01-24 07:32:42.05153	2026-01-24 07:32:42.05153
77	10	15	27	a	2026-01-24 07:32:43.552251	2026-01-24 07:32:43.552251
78	10	15	27	a	2026-01-24 07:32:45.839164	2026-01-24 07:32:45.839164
79	10	4	2	a	2026-01-24 07:32:47.900689	2026-01-24 07:32:47.900689
80	10	15	27	a	2026-01-24 07:32:52.281037	2026-01-24 07:32:52.281037
81	10	4	2	a	2026-01-24 07:32:54.243678	2026-01-24 07:32:54.243678
82	10	15	27	a	2026-01-24 07:32:55.746221	2026-01-24 07:32:55.746221
83	10	4	2	***	2026-01-24 07:41:23.808224	2026-01-24 07:41:23.808224
\.


--
-- TOC entry 3844 (class 0 OID 16800)
-- Dependencies: 256
-- Data for Name: DailyLimit; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."DailyLimit" ("LimitId", "UserId", "ActionType", "ActionDate", "Count", "CreatedAt") FROM stdin;
1	4	expert_chat	2026-01-13	2	2026-01-13 23:52:12.939727
3	4	ai_chat_question	2026-01-21	3617	2026-01-21 17:38:59.065674
2	4	request_match	2026-01-21	5	2026-01-21 17:32:02.05878
4	14	request_match	2026-01-23	1	2026-01-23 06:46:43.581083
5	14	ai_chat_question	2026-01-23	3914	2026-01-23 22:40:14.551752
6	14	ai_chat_question	2026-01-24	1609	2026-01-24 13:06:33.641149
8	15	ai_chat_question	2026-01-24	856	2026-01-24 13:18:50.099639
9	15	expert_confirm	2026-01-24	1	2026-01-24 13:19:02.068806
10	15	expert_chat	2026-01-24	1	2026-01-24 13:20:28.114071
7	4	request_match	2026-01-24	3	2026-01-24 13:08:02.288441
11	4	ai_chat_question	2026-01-28	1428	2026-01-28 10:58:26.972229
\.


--
-- TOC entry 3864 (class 0 OID 17187)
-- Dependencies: 276
-- Data for Name: EventSubmission; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."EventSubmission" ("SubmissionId", "EventId", "UserId", "PetId", "MediaUrl", "MediaType", "ThumbnailUrl", "Caption", "VoteCount", "Rank", "IsWinner", "CreatedAt", "IsDeleted") FROM stdin;
1	2	3	1	file:///data/user/0/com.pawnder/cache/rn_image_picker_lib_temp_506a9dcb-1997-40b5-a6f8-34cb6a6592b1.jpg	image	\N	Em dang ngu trua	1	1	t	2026-01-10 00:20:54.285631	f
2	2	4	2	file:///data/user/0/com.pawnder/cache/rn_image_picker_lib_temp_8f43d4fb-698e-4f8b-b095-4f9353e0072e.jpg	image	\N	kkkkk	0	2	t	2026-01-10 00:22:53.779839	f
3	3	4	2	https://res.cloudinary.com/darsvolyp/image/upload/v1768029527/pawnder/pets/4/jdapiltg1c39gq4svw91.jpg	image	\N	jkkkkkkkkkkk	0	1	t	2026-01-10 14:18:41.131501	f
4	4	4	2	https://res.cloudinary.com/darsvolyp/image/upload/v1768136395/pawnder/pets/4/dcdk2sjq9xhhaages9mt.jpg	image	\N	kkkk	0	1	t	2026-01-11 19:59:47.947376	f
5	5	3	1	https://res.cloudinary.com/darsvolyp/image/upload/v1768141447/pawnder/pets/3/f8yc2ike2ufd4bbbokn3.jpg	image	\N	kkkk	0	1	t	2026-01-11 21:24:00.871595	f
20	29	4	10	https://res.cloudinary.com/darsvolyp/image/upload/v1769240427/pawnder/pets/4/oeo86zmqulauzuhsdv76.jpg	image	\N	okkk	1	1	t	2026-01-24 14:40:28.380235	f
\.


--
-- TOC entry 3866 (class 0 OID 17225)
-- Dependencies: 278
-- Data for Name: EventVote; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."EventVote" ("VoteId", "SubmissionId", "UserId", "CreatedAt") FROM stdin;
15	20	15	2026-01-24 14:40:43.539626
\.


--
-- TOC entry 3831 (class 0 OID 16640)
-- Dependencies: 243
-- Data for Name: ExpertConfirmation; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."ExpertConfirmation" ("ExpertId", "UserId", "ChatAIId", "UserQuestion", "Status", "Message", "CreatedAt", "UpdatedAt") FROM stdin;
2	3	1	Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn. Bạn có thể kết nối tôi với chuyên gia không?	Pending	Người dùng cần xác nhận chuyên gia cho câu trả lời AI về giống chó.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	4	2	Con này có thể phối với giống nào tốt?	Confirmed	Chuyên gia đã kiểm tra và đồng ý với câu trả lời.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	15	5	Xac nhan giup toi	confirmed	ok	2026-01-24 06:19:01.992042	2026-01-24 06:25:48.752987
\.


--
-- TOC entry 3842 (class 0 OID 16782)
-- Dependencies: 254
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Notification" ("NotificationId", "UserId", "Title", "Message", "Type", "IsRead", "ReferenceId", "CreatedAt", "UpdatedAt", "Status", "IsBroadcast", "SentAt", "CreatedByUserId") FROM stdin;
3	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 09/01/2026 01:30	appointment_invite	t	\N	2026-01-09 03:10:51.714618	2026-01-09 03:12:46.766829	SENT	f	\N	\N
9	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 09/01/2026 20:00	appointment_invite	t	\N	2026-01-09 17:34:06.737843	2026-01-09 17:34:24.515925	SENT	f	\N	\N
10	4	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 17:35:12.384715	2026-01-09 17:35:27.738562	SENT	f	\N	\N
11	3	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 17:38:46.414194	2026-01-09 17:38:57.710526	SENT	f	\N	\N
12	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 10/01/2026 20:30	appointment_accepted	t	\N	2026-01-09 18:07:09.062104	2026-01-09 20:40:22.168138	SENT	f	\N	\N
13	4	Cuộc hẹn đang diễn ra! 🎉	Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!	appointment_ongoing	t	\N	2026-01-09 20:40:51.104491	2026-01-09 20:57:49.978831	SENT	f	\N	\N
15	3	Cuộc hẹn đã kết thúc 🎊	Cuộc hẹn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!	appointment_completed	t	\N	2026-01-09 21:09:50.725573	2026-01-09 21:48:46.123383	SENT	f	\N	\N
1	3	Chào mừng bạn đến với Pawnder!	Bạn đã đăng ký tài khoản thành công.	WELCOME	t	\N	2026-01-05 13:46:27.838373	2026-01-09 21:48:51.540658	SENT	f	\N	\N
4	3	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: Chan	appointment_cancelled	t	\N	2026-01-09 03:34:58.364728	2026-01-09 21:48:51.540658	SENT	f	\N	\N
5	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 09/01/2026 01:00	appointment_invite	t	\N	2026-01-09 04:01:18.128254	2026-01-09 21:48:51.540658	SENT	f	\N	\N
6	3	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: a	appointment_cancelled	t	\N	2026-01-09 04:03:23.385952	2026-01-09 21:48:51.540658	SENT	f	\N	\N
7	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 09/01/2026 00:00	appointment_invite	t	\N	2026-01-09 04:04:32.775104	2026-01-09 21:48:51.540658	SENT	f	\N	\N
8	3	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: ab	appointment_cancelled	t	\N	2026-01-09 04:18:32.915482	2026-01-09 21:48:51.540658	SENT	f	\N	\N
14	3	Cuộc hẹn đang diễn ra! 🎉	Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!	appointment_ongoing	t	\N	2026-01-09 20:40:51.317171	2026-01-09 21:48:51.540658	SENT	f	\N	\N
2	4	Có yêu cầu tư vấn mới	Người dùng đã gửi yêu cầu tư vấn AI.	AI_CONSULTATION	t	\N	2026-01-05 13:46:27.838373	2026-01-09 21:48:56.282729	SENT	f	\N	\N
16	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 10/01/2026 00:00	appointment_invite	t	\N	2026-01-09 21:49:31.017055	2026-01-09 21:49:41.159716	SENT	f	\N	\N
17	4	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 21:50:09.324377	2026-01-09 21:50:14.954606	SENT	f	\N	\N
18	3	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 21:50:34.238403	2026-01-09 21:50:41.479806	SENT	f	\N	\N
19	4	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 21:50:51.993139	2026-01-09 21:53:17.167582	SENT	f	\N	\N
20	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 10/01/2026 23:50	appointment_accepted	t	\N	2026-01-09 21:51:08.178649	2026-01-09 21:53:17.167582	SENT	f	\N	\N
21	3	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: Co viec rieng	appointment_cancelled	t	\N	2026-01-09 21:53:46.549805	2026-01-09 21:54:00.831512	SENT	f	\N	\N
22	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 10/01/2026 00:00	appointment_invite	t	\N	2026-01-09 21:54:34.092544	2026-01-09 21:54:47.266387	SENT	f	\N	\N
24	3	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 10/01/2026 00:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-09 21:54:55.613347	2026-01-09 21:55:05.402843	SENT	f	\N	\N
23	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 10/01/2026 00:00	appointment_accepted	t	\N	2026-01-09 21:54:55.421163	2026-01-09 21:55:21.820122	SENT	f	\N	\N
25	4	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: Co viec rieng	appointment_cancelled	t	\N	2026-01-09 21:55:16.344081	2026-01-09 21:55:21.820122	SENT	f	\N	\N
26	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 10/01/2026 00:00	appointment_invite	t	\N	2026-01-09 21:56:50.656285	2026-01-09 21:57:10.968499	SENT	f	\N	\N
27	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 10/01/2026 00:00	appointment_accepted	t	\N	2026-01-09 21:58:08.674204	2026-01-09 21:59:19.39972	SENT	f	\N	\N
28	3	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 10/01/2026 00:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-09 21:58:08.859083	2026-01-09 22:02:15.365034	SENT	f	\N	\N
29	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-09 22:02:49.403307	2026-01-09 22:11:51.383832	SENT	f	\N	\N
31	4	Lời mời gặp gỡ mới! 🐾	Bé Milo muốn hẹn gặp bé Luna vào 10/01/2026 01:00	appointment_invite	t	\N	2026-01-09 22:11:40.172681	2026-01-09 22:11:51.383832	SENT	f	\N	\N
30	3	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-09 22:02:49.635587	2026-01-09 22:11:52.469123	SENT	f	\N	\N
32	3	Cuộc hẹn được xác nhận! 🎉	Bé Luna đã đồng ý gặp gỡ vào 10/01/2026 01:00	appointment_accepted	t	\N	2026-01-09 22:12:14.457492	2026-01-09 22:12:25.722522	SENT	f	\N	\N
33	4	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Milo vào 10/01/2026 01:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-09 22:12:14.671566	2026-01-09 22:13:20.434347	SENT	f	\N	\N
34	3	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-09 22:16:18.438943	2026-01-09 22:17:49.96298	SENT	f	\N	\N
35	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-09 22:16:18.777163	2026-01-09 22:17:58.864456	SENT	f	\N	\N
36	4	Lời mời gặp gỡ mới! 🐾	Bé Milo muốn hẹn gặp bé Luna vào 10/01/2026 01:00	appointment_invite	t	\N	2026-01-09 22:18:43.973652	2026-01-09 22:31:29.271972	SENT	f	\N	\N
39	4	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: ok	appointment_cancelled	t	\N	2026-01-09 22:44:24.441525	2026-01-09 22:44:31.355877	SENT	f	\N	\N
38	4	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Milo vào 10/01/2026 01:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-09 22:43:19.796107	2026-01-09 22:44:33.80013	SENT	f	\N	\N
37	3	Cuộc hẹn được xác nhận! 🎉	Bé Luna đã đồng ý gặp gỡ vào 10/01/2026 01:00	appointment_accepted	t	\N	2026-01-09 22:43:19.612546	2026-01-09 22:45:22.558875	SENT	f	\N	\N
40	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 10/01/2026 01:00	appointment_invite	t	\N	2026-01-09 22:45:10.780865	2026-01-09 22:45:22.558875	SENT	f	\N	\N
141	3	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.56811	2026-01-24 01:54:53.853678	SENT	f	\N	\N
150	3	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.468728	2026-01-24 01:54:53.853678	SENT	f	\N	\N
42	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-10 00:22:07.657283	2026-01-11 21:11:06.791494	SENT	f	\N	\N
41	4	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-09 22:46:26.815187	2026-01-10 00:29:53.829527	SENT	f	\N	\N
44	4	🎉 Chúc mừng! Bạn đạt Top 2!	Bé Luna đã giành vị trí Top 2 trong 'Mèo ngủ xấu nhất !!!'!	event_winner	t	\N	2026-01-10 00:26:39.679677	2026-01-10 00:29:53.829527	SENT	f	\N	\N
45	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Luna đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất kkkk'!	event_winner	t	\N	2026-01-10 14:20:13.720903	2026-01-10 14:30:43.734219	SENT	f	\N	\N
46	4	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-10 14:42:53.369169	2026-01-10 14:43:26.87533	SENT	f	\N	\N
48	1	🎉 Sự kiện mới!	Sự kiện 'Bé mèo cute nhất !' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-11 19:57:44.823524	2026-01-11 19:57:44.823524	SENT	f	\N	\N
43	3	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Milo đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất !!!'!	event_winner	t	\N	2026-01-10 00:26:39.477814	2026-01-11 21:11:06.791494	SENT	f	\N	\N
47	3	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-10 14:42:53.73241	2026-01-11 21:11:06.791494	SENT	f	\N	\N
49	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Luna đã giành vị trí Top 1 trong 'Bé mèo cute nhất !'!	event_winner	t	\N	2026-01-11 20:01:11.286605	2026-01-11 21:11:08.337067	SENT	f	\N	\N
50	4	Lời mời gặp gỡ mới! 🐾	Bé Milo muốn hẹn gặp bé Luna vào 12/01/2026 00:00	appointment_invite	t	\N	2026-01-11 21:15:32.404214	2026-01-11 21:16:00.035108	SENT	f	\N	\N
51	3	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-11 21:16:54.934879	2026-01-11 21:17:01.992702	SENT	f	\N	\N
53	3	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 12/01/2026 23:30 đã được xác nhận	appointment_accepted	t	\N	2026-01-11 21:17:22.683171	2026-01-11 21:19:35.4273	SENT	f	\N	\N
55	1	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-11 21:22:28.371498	2026-01-11 21:22:28.371498	SENT	f	\N	\N
57	1	🎉 Sự kiện mới!	Sự kiện 'Mèo' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-11 21:28:13.709001	2026-01-11 21:28:13.709001	SENT	f	\N	\N
52	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 12/01/2026 23:30	appointment_accepted	t	\N	2026-01-11 21:17:22.499659	2026-01-11 23:32:12.090583	SENT	f	\N	\N
54	4	Đối phương đã check-in! 📍	Bé Milo đã đến địa điểm hẹn. Hãy nhanh chân check-in nhé!	appointment_checkin	t	\N	2026-01-11 21:19:48.718269	2026-01-11 23:32:12.090583	SENT	f	\N	\N
65	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-11 23:04:03.350851	2026-01-11 23:32:12.090583	SENT	f	\N	\N
66	1	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất 2026' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-11 23:45:04.158452	2026-01-11 23:45:04.158452	SENT	f	\N	\N
67	1	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-11 23:46:33.468729	2026-01-11 23:46:33.468729	SENT	f	\N	\N
70	1	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-11 23:47:51.097824	2026-01-11 23:47:51.097824	SENT	f	\N	\N
56	3	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Milo đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất !!'!	event_winner	t	\N	2026-01-11 21:26:58.075693	2026-01-11 23:48:13.647652	SENT	f	\N	\N
58	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 21:30:53.973049	2026-01-11 23:48:13.647652	SENT	f	\N	\N
59	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 21:30:58.536296	2026-01-11 23:48:13.647652	SENT	f	\N	\N
60	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 21:31:07.533844	2026-01-11 23:48:13.647652	SENT	f	\N	\N
61	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 21:31:12.916163	2026-01-11 23:48:13.647652	SENT	f	\N	\N
62	3	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Milo vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 21:31:24.423798	2026-01-11 23:48:13.647652	SENT	f	\N	\N
63	3	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Milo đã giành vị trí Top 1 trong 'Mèo'!	event_winner	t	\N	2026-01-11 21:34:59.136935	2026-01-11 23:48:13.647652	SENT	f	\N	\N
64	3	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-11 23:04:03.041267	2026-01-11 23:48:13.647652	SENT	f	\N	\N
243	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.101442	2026-01-24 01:54:53.853678	SENT	f	\N	\N
313	3	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.407929	2026-01-24 01:54:53.853678	SENT	f	\N	\N
325	3	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:24.979815	2026-01-24 01:54:53.853678	SENT	f	\N	\N
368	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	f	\N	2026-01-24 15:30:11.196895	2026-01-24 15:30:11.196895	SENT	f	\N	\N
369	14	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	f	\N	2026-01-24 15:30:11.2119	2026-01-24 15:30:11.2119	SENT	f	\N	\N
81	3	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-12 00:17:25.615568	2026-01-12 00:17:35.417639	SENT	f	\N	\N
68	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Luna vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 23:47:11.795301	2026-01-13 21:11:26.416564	SENT	f	\N	\N
69	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Luna vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 23:47:16.359162	2026-01-13 21:11:26.416564	SENT	f	\N	\N
71	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Luna vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 23:48:53.701989	2026-01-13 21:11:26.416564	SENT	f	\N	\N
72	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé Luna vừa nhận được 1 vote!	event_vote	t	\N	2026-01-11 23:49:59.060674	2026-01-13 21:11:26.416564	SENT	f	\N	\N
73	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Luna đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất 2026'!	event_winner	t	\N	2026-01-11 23:53:53.153897	2026-01-13 21:11:26.416564	SENT	f	\N	\N
83	3	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-12 00:17:47.552107	2026-01-14 00:23:37.460873	SENT	f	\N	\N
80	4	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-12 00:17:25.46738	2026-01-13 21:11:26.416564	SENT	f	\N	\N
82	4	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-12 00:17:47.425808	2026-01-13 21:11:26.416564	SENT	f	\N	\N
321	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé MyMy vừa nhận được vote đầu tiên!	event_vote	t	\N	2026-01-23 22:39:36.484078	2026-01-24 02:10:08.688743	SENT	f	\N	\N
85	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-14 00:08:43.971097	2026-01-14 00:23:37.460873	SENT	f	\N	\N
87	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:09:53.784667	2026-01-14 00:23:37.460873	SENT	f	\N	\N
89	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:10:41.74118	2026-01-14 00:23:37.460873	SENT	f	\N	\N
91	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:12:26.423958	2026-01-14 00:23:37.460873	SENT	f	\N	\N
93	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:15:46.097466	2026-01-14 00:23:37.460873	SENT	f	\N	\N
96	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:21:05.50626	2026-01-14 00:23:37.460873	SENT	f	\N	\N
98	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:21:15.904346	2026-01-14 00:23:37.460873	SENT	f	\N	\N
84	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-14 00:08:43.835309	2026-01-14 00:36:24.1106	SENT	f	\N	\N
86	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:09:53.672289	2026-01-14 00:36:24.1106	SENT	f	\N	\N
88	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:10:41.517357	2026-01-14 00:36:24.1106	SENT	f	\N	\N
90	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:12:26.319467	2026-01-14 00:36:24.1106	SENT	f	\N	\N
92	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:15:45.986473	2026-01-14 00:36:24.1106	SENT	f	\N	\N
94	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé MyMy vừa nhận được vote đầu tiên!	event_vote	t	\N	2026-01-14 00:19:52.958551	2026-01-14 00:36:24.1106	SENT	f	\N	\N
111	3	Cuộc hẹn đang diễn ra! 🎉	Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!	appointment_ongoing	t	\N	2026-01-14 00:51:54.625671	2026-01-23 13:37:13.043243	SENT	f	\N	\N
97	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-14 00:21:15.78505	2026-01-14 00:36:24.1106	SENT	f	\N	\N
99	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất 2026'!	event_winner	t	\N	2026-01-14 00:23:11.035625	2026-01-14 00:36:24.1106	SENT	f	\N	\N
100	4	Lời mời gặp gỡ mới! 🐾	Bé Milo muốn hẹn gặp bé Luna vào 14/01/2026 03:00	appointment_invite	t	\N	2026-01-14 00:29:05.190612	2026-01-14 00:36:24.1106	SENT	f	\N	\N
102	4	Bạn đã từ chối cuộc hẹn	Bạn đã từ chối cuộc hẹn với bé Milo	appointment_rejected	t	\N	2026-01-14 00:34:15.383431	2026-01-14 00:36:24.1106	SENT	f	\N	\N
103	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 14/01/2026 03:00	appointment_invite	t	\N	2026-01-14 00:40:49.771673	2026-01-14 00:41:31.185531	SENT	f	\N	\N
105	3	Bạn đã từ chối cuộc hẹn	Bạn đã từ chối cuộc hẹn với bé Luna	appointment_rejected	t	\N	2026-01-14 00:43:00.426668	2026-01-14 00:45:19.884257	SENT	f	\N	\N
101	3	Cuộc hẹn bị từ chối 😢	Bé Luna không thể tham gia cuộc hẹn. Lý do: Ban Viec	appointment_rejected	t	\N	2026-01-14 00:34:14.939104	2026-01-14 00:45:22.327803	SENT	f	\N	\N
370	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	f	\N	2026-01-24 18:30:12.089001	2026-01-24 18:30:12.089001	SENT	f	\N	\N
109	4	Đối phương đã check-in! 📍	Bé Milo đã đến địa điểm hẹn. Hãy nhanh chân check-in nhé!	appointment_checkin	t	\N	2026-01-14 00:49:55.107251	2026-01-14 00:51:40.939256	SENT	f	\N	\N
371	15	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	f	\N	2026-01-24 18:30:12.128268	2026-01-24 18:30:12.128268	SENT	f	\N	\N
104	4	Cuộc hẹn bị từ chối 😢	Bé Milo không thể tham gia cuộc hẹn. Lý do: Co viec ban	appointment_rejected	t	\N	2026-01-14 00:43:00.24332	2026-01-14 20:29:25.068395	SENT	f	\N	\N
106	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 14/01/2026 03:00	appointment_accepted	t	\N	2026-01-14 00:45:38.431316	2026-01-14 20:29:25.068395	SENT	f	\N	\N
108	4	Cuộc hẹn bị hủy	Cuộc hẹn đã bị hủy. Lý do: Vien ban dot xuat	appointment_cancelled	t	\N	2026-01-14 00:46:18.925338	2026-01-14 20:29:25.068395	SENT	f	\N	\N
110	4	Cuộc hẹn đang diễn ra! 🎉	Cả hai đã check-in. Chúc các bé có buổi gặp vui vẻ!	appointment_ongoing	t	\N	2026-01-14 00:51:54.406934	2026-01-14 20:29:25.068395	SENT	f	\N	\N
107	3	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 14/01/2026 03:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-14 00:45:38.621454	2026-01-23 13:37:13.043243	SENT	f	\N	\N
112	3	Cuộc hẹn đã kết thúc 🎊	Cuộc hẹn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!	appointment_completed	t	\N	2026-01-14 00:53:09.773063	2026-01-23 13:37:13.043243	SENT	f	\N	\N
113	4	Cuộc hẹn đã kết thúc 🎊	Cuộc hẹn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ!	appointment_completed	t	\N	2026-01-14 00:53:09.903477	2026-01-14 20:29:25.068395	SENT	f	\N	\N
133	3	Cuộc hẹn bị hủy sát giờ ⚠️	Cuộc hẹn đã bị hủy. Lý do: Ban roi	appointment_cancelled	t	\N	2026-01-23 14:51:54.435347	2026-01-24 01:54:53.853678	SENT	f	\N	\N
134	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 23/01/2026 17:00	appointment_invite	t	\N	2026-01-23 14:52:51.612937	2026-01-24 01:54:53.853678	SENT	f	\N	\N
138	3	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-23 17:04:56.517956	2026-01-24 01:54:53.853678	SENT	f	\N	\N
118	4	Lời mời gặp gỡ mới! 🐾	Bé Milo muốn hẹn gặp bé Luna vào 14/01/2026 23:00	appointment_invite	t	\N	2026-01-14 20:41:11.562647	2026-01-14 20:41:46.97836	SENT	f	\N	\N
147	16	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.64599	2026-01-24 01:58:02.076992	SENT	f	\N	\N
344	14	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Bella vào 24/01/2026 14:00	appointment_invite	t	\N	2026-01-24 02:17:02.96114	2026-01-24 13:04:42.481067	SENT	f	\N	\N
136	4	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-23 16:04:54.748798	2026-01-23 20:40:02.81908	SENT	f	\N	\N
137	4	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-23 17:04:56.503537	2026-01-23 20:40:02.81908	SENT	f	\N	\N
117	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo ngủ  xuất nahats'!	event_winner	t	\N	2026-01-14 20:37:00.327747	2026-01-15 17:34:10.568395	SENT	f	\N	\N
123	\N	Thông báo bảo trì	Khung giờ 20-21h30 ngày 14/1. Trân trọng!	admin_broadcast	f	\N	2026-01-15 18:06:02.444948	2026-01-15 18:06:24.474695	SENT	t	2026-01-15 18:06:24.474695	1
124	2	Thông báo bảo trì	Khung giờ 20-21h30 ngày 14/1. Trân trọng!	admin_broadcast	f	123	2026-01-15 18:06:24.474695	2026-01-15 18:06:24.474695	SENT	t	2026-01-15 18:06:24.474695	1
125	1	Thông báo bảo trì	Khung giờ 20-21h30 ngày 14/1. Trân trọng!	admin_broadcast	f	123	2026-01-15 18:06:24.474695	2026-01-15 18:06:24.474695	SENT	t	2026-01-15 18:06:24.474695	1
127	4	Thông báo bảo trì	Khung giờ 20-21h30 ngày 14/1. Trân trọng!	admin_broadcast	t	123	2026-01-15 18:06:24.474695	2026-01-15 18:06:45.551228	SENT	t	2026-01-15 18:06:24.474695	1
128	\N	TEst	Test	admin_broadcast	f	\N	2026-01-15 18:08:15.051491	2026-01-15 18:08:15.051491	DRAFT	t	\N	1
114	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ  xuất nahats' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-14 20:33:26.638376	2026-01-16 20:22:20.66787	SENT	f	\N	\N
116	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé MyMy vừa nhận được vote đầu tiên!	event_vote	t	\N	2026-01-14 20:35:02.441257	2026-01-16 20:22:20.66787	SENT	f	\N	\N
115	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ  xuất nahats' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-14 20:33:26.812657	2026-01-23 13:37:13.043243	SENT	f	\N	\N
119	3	Cuộc hẹn được xác nhận! 🎉	Bé Luna đã đồng ý gặp gỡ vào 14/01/2026 23:00	appointment_accepted	t	\N	2026-01-14 20:42:30.726076	2026-01-23 13:37:13.043243	SENT	f	\N	\N
121	3	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-15 00:32:38.524486	2026-01-23 13:37:13.043243	SENT	f	\N	\N
126	3	Thông báo bảo trì	Khung giờ 20-21h30 ngày 14/1. Trân trọng!	admin_broadcast	t	123	2026-01-15 18:06:24.474695	2026-01-23 13:37:13.043243	SENT	t	2026-01-15 18:06:24.474695	1
129	3	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Milo vào 23/01/2026 16:00	appointment_invite	t	\N	2026-01-23 13:35:24.236934	2026-01-23 13:37:13.043243	SENT	f	\N	\N
131	3	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 23/01/2026 16:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-23 13:37:30.119368	2026-01-23 13:38:35.145537	SENT	f	\N	\N
130	4	Cuộc hẹn được xác nhận! 🎉	Bé Milo đã đồng ý gặp gỡ vào 23/01/2026 16:00	appointment_accepted	t	\N	2026-01-23 13:37:30.081623	2026-01-23 13:40:42.765821	SENT	f	\N	\N
132	4	Lời mời gặp gỡ mới! 🐾	Bé Bella muốn hẹn gặp bé Luna vào 23/01/2026 16:00	appointment_invite	t	\N	2026-01-23 13:49:46.487231	2026-01-23 13:56:59.684234	SENT	f	\N	\N
140	18	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 20:50:00.55508	2026-01-23 20:50:00.55508	SENT	f	\N	\N
142	19	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 20:50:00.58184	2026-01-23 20:50:00.58184	SENT	f	\N	\N
146	4	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.628968	2026-01-23 20:50:06.462767	SENT	f	\N	\N
149	18	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:05:29.447998	2026-01-23 21:05:29.447998	SENT	f	\N	\N
151	19	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:05:29.487852	2026-01-23 21:05:29.487852	SENT	f	\N	\N
144	15	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.60525	2026-01-23 21:44:05.591001	SENT	f	\N	\N
153	15	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.528936	2026-01-23 21:44:05.591001	SENT	f	\N	\N
135	14	Cuộc hẹn đã hết hạn ⏰	Cuộc hẹn đã tự động hết hạn do không được phản hồi trước giờ hẹn	appointment_expired	t	\N	2026-01-23 16:04:54.449884	2026-01-23 22:26:43.956818	SENT	f	\N	\N
139	14	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.503224	2026-01-23 22:26:43.956818	SENT	f	\N	\N
148	14	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.429526	2026-01-23 22:26:43.956818	SENT	f	\N	\N
143	17	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.59387	2026-01-24 01:40:48.729687	SENT	f	\N	\N
152	17	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.511002	2026-01-24 01:40:48.729687	SENT	f	\N	\N
145	20	🎉 Sự kiện mới!	Sự kiện 'Bé Mèo Mập Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 20:50:00.617554	2026-01-24 01:49:32.385921	SENT	f	\N	\N
159	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:20.944278	2026-01-24 01:54:53.853678	SENT	f	\N	\N
168	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.169413	2026-01-24 01:54:53.853678	SENT	f	\N	\N
177	3	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:11.828782	2026-01-24 01:54:53.853678	SENT	f	\N	\N
158	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:06:20.920067	2026-01-23 21:06:20.920067	SENT	f	\N	\N
160	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:06:20.963207	2026-01-23 21:06:20.963207	SENT	f	\N	\N
156	16	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.584489	2026-01-24 01:58:02.076992	SENT	f	\N	\N
165	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:21.09708	2026-01-24 01:58:02.076992	SENT	f	\N	\N
174	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.228468	2026-01-24 01:58:02.076992	SENT	f	\N	\N
345	4	Cuộc hẹn được xác nhận! 🎉	Bé Bella đã đồng ý gặp gỡ vào 24/01/2026 14:00	appointment_accepted	t	\N	2026-01-24 13:04:53.54444	2026-01-24 13:05:04.95167	SENT	f	\N	\N
167	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:07:46.160627	2026-01-23 21:07:46.160627	SENT	f	\N	\N
169	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:07:46.180005	2026-01-23 21:07:46.180005	SENT	f	\N	\N
155	4	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.56098	2026-01-23 21:10:42.514973	SENT	f	\N	\N
164	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:21.064393	2026-01-23 21:10:42.514973	SENT	f	\N	\N
173	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.220562	2026-01-23 21:10:42.514973	SENT	f	\N	\N
176	18	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:24:11.714779	2026-01-23 21:24:11.714779	SENT	f	\N	\N
178	19	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:24:11.928813	2026-01-23 21:24:11.928813	SENT	f	\N	\N
162	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:21.012997	2026-01-23 21:44:05.591001	SENT	f	\N	\N
171	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.199545	2026-01-23 21:44:05.591001	SENT	f	\N	\N
180	15	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:12.146153	2026-01-23 21:44:05.591001	SENT	f	\N	\N
157	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:20.888213	2026-01-23 22:26:43.956818	SENT	f	\N	\N
166	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.150337	2026-01-23 22:26:43.956818	SENT	f	\N	\N
175	14	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:11.572191	2026-01-23 22:26:43.956818	SENT	f	\N	\N
161	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:20.991503	2026-01-24 01:40:48.729687	SENT	f	\N	\N
170	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.191357	2026-01-24 01:40:48.729687	SENT	f	\N	\N
179	17	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:12.035087	2026-01-24 01:40:48.729687	SENT	f	\N	\N
154	20	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:05:29.541526	2026-01-24 01:49:32.385921	SENT	f	\N	\N
163	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:06:21.041019	2026-01-24 01:49:32.385921	SENT	f	\N	\N
172	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo Ngủ Xấu Nhất 2026' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc, giải thưởng. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:07:46.208823	2026-01-24 01:49:32.385921	SENT	f	\N	\N
181	20	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:12.243986	2026-01-24 01:49:32.385921	SENT	f	\N	\N
346	14	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 24/01/2026 14:00 đã được xác nhận	appointment_accepted	t	\N	2026-01-24 13:04:53.579818	2026-01-24 13:06:47.981173	SENT	f	\N	\N
182	4	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:12.353497	2026-01-23 21:24:18.943889	SENT	f	\N	\N
347	15	Chuyên gia Trần Thị B đã xác nhận thông tin	ok	expert_confirmation	t	\N	2026-01-24 13:25:48.78022	2026-01-24 13:25:55.954746	SENT	f	\N	\N
187	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:29:59.804586	2026-01-24 01:54:53.853678	SENT	f	\N	\N
196	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.10019	2026-01-24 01:54:53.853678	SENT	f	\N	\N
186	18	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:29:59.679401	2026-01-23 21:29:59.679401	SENT	f	\N	\N
188	19	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:29:59.912668	2026-01-23 21:29:59.912668	SENT	f	\N	\N
205	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.395174	2026-01-24 01:54:53.853678	SENT	f	\N	\N
183	16	🎉 Sự kiện mới!	Sự kiện 'Mèo Ngủ Xấu Nhất !' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:24:12.469816	2026-01-24 01:58:02.076992	SENT	f	\N	\N
193	16	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:30:00.476882	2026-01-24 01:58:02.076992	SENT	f	\N	\N
202	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.725799	2026-01-24 01:58:02.076992	SENT	f	\N	\N
211	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:35.012247	2026-01-24 01:58:02.076992	SENT	f	\N	\N
195	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:30:26.984201	2026-01-23 21:30:26.984201	SENT	f	\N	\N
197	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:30:27.194151	2026-01-23 21:30:27.194151	SENT	f	\N	\N
348	15	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Max vào 24/01/2026 17:00	appointment_invite	t	\N	2026-01-24 14:33:54.343484	2026-01-24 14:34:02.092066	SENT	f	\N	\N
349	4	Cuộc hẹn được xác nhận! 🎉	Bé Max đã đồng ý gặp gỡ vào 24/01/2026 17:00	appointment_accepted	f	\N	2026-01-24 14:34:32.087226	2026-01-24 14:34:32.087226	SENT	f	\N	\N
351	14	Đối phương đã check-in! 📍	Bé Luna đã đến địa điểm hẹn. Hãy nhanh chân check-in nhé!	appointment_checkin	f	\N	2026-01-24 14:37:39.867968	2026-01-24 14:37:39.867968	SENT	f	\N	\N
204	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:31:34.256593	2026-01-23 21:31:34.256593	SENT	f	\N	\N
206	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:31:34.512267	2026-01-23 21:31:34.512267	SENT	f	\N	\N
184	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo Ngủ Xấu Nhất !'!	event_winner	t	\N	2026-01-23 21:27:17.256442	2026-01-23 21:41:00.889923	SENT	f	\N	\N
192	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:30:00.354818	2026-01-23 21:41:00.889923	SENT	f	\N	\N
201	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.607801	2026-01-23 21:41:00.889923	SENT	f	\N	\N
190	15	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:30:00.147134	2026-01-23 21:44:05.591001	SENT	f	\N	\N
199	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.408914	2026-01-23 21:44:05.591001	SENT	f	\N	\N
208	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.704794	2026-01-23 21:44:05.591001	SENT	f	\N	\N
185	14	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:29:59.544628	2026-01-23 22:26:43.956818	SENT	f	\N	\N
194	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:26.883406	2026-01-23 22:26:43.956818	SENT	f	\N	\N
203	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.157928	2026-01-23 22:26:43.956818	SENT	f	\N	\N
189	17	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:30:00.01804	2026-01-24 01:40:48.729687	SENT	f	\N	\N
198	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.293706	2026-01-24 01:40:48.729687	SENT	f	\N	\N
207	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.610174	2026-01-24 01:40:48.729687	SENT	f	\N	\N
191	20	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất !!' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:30:00.245258	2026-01-24 01:49:32.385921	SENT	f	\N	\N
200	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:30:27.503282	2026-01-24 01:49:32.385921	SENT	f	\N	\N
209	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.82007	2026-01-24 01:49:32.385921	SENT	f	\N	\N
210	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu nhất !!' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:31:34.918322	2026-01-23 21:41:00.889923	SENT	f	\N	\N
212	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất !!'!	event_winner	t	\N	2026-01-23 21:32:24.13498	2026-01-23 21:41:00.889923	SENT	f	\N	\N
215	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.030005	2026-01-24 01:54:53.853678	SENT	f	\N	\N
214	18	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:46:08.012772	2026-01-23 21:46:08.012772	SENT	f	\N	\N
216	19	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 21:46:08.051808	2026-01-23 21:46:08.051808	SENT	f	\N	\N
222	3	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Milo đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất !!'!	event_winner	t	\N	2026-01-23 21:47:37.955448	2026-01-24 01:54:53.853678	SENT	f	\N	\N
225	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.092284	2026-01-24 01:54:53.853678	SENT	f	\N	\N
234	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.37554	2026-01-24 01:54:53.853678	SENT	f	\N	\N
221	16	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.12964	2026-01-24 01:58:02.076992	SENT	f	\N	\N
224	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:47:38.083993	2026-01-23 21:47:38.083993	SENT	f	\N	\N
226	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:47:38.103333	2026-01-23 21:47:38.103333	SENT	f	\N	\N
231	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.139878	2026-01-24 01:58:02.076992	SENT	f	\N	\N
240	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.440376	2026-01-24 01:58:02.076992	SENT	f	\N	\N
319	16	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.463024	2026-01-24 01:58:02.076992	SENT	f	\N	\N
331	16	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:25.045874	2026-01-24 01:58:02.076992	SENT	f	\N	\N
233	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:49:13.367304	2026-01-23 21:49:13.367304	SENT	f	\N	\N
235	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 21:49:13.387077	2026-01-23 21:49:13.387077	SENT	f	\N	\N
328	4	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:25.011415	2026-01-24 02:10:08.688743	SENT	f	\N	\N
218	15	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.090872	2026-01-24 13:07:47.128323	SENT	f	\N	\N
228	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.118195	2026-01-24 13:07:47.128323	SENT	f	\N	\N
237	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.406926	2026-01-24 13:07:47.128323	SENT	f	\N	\N
242	18	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:00:16.085792	2026-01-23 22:00:16.085792	SENT	f	\N	\N
244	19	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:00:16.116499	2026-01-23 22:00:16.116499	SENT	f	\N	\N
213	14	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:07.987636	2026-01-23 22:26:43.956818	SENT	f	\N	\N
223	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.076877	2026-01-23 22:26:43.956818	SENT	f	\N	\N
232	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.355131	2026-01-23 22:26:43.956818	SENT	f	\N	\N
329	15	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:25.028377	2026-01-24 13:07:47.128323	SENT	f	\N	\N
350	15	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Luna vào 24/01/2026 17:00 đã được xác nhận	appointment_accepted	f	\N	2026-01-24 14:34:32.109708	2026-01-24 14:34:32.109708	SENT	f	\N	\N
219	20	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.10374	2026-01-24 01:49:32.385921	SENT	f	\N	\N
229	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.125641	2026-01-24 01:49:32.385921	SENT	f	\N	\N
238	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.420475	2026-01-24 01:49:32.385921	SENT	f	\N	\N
330	20	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:25.036418	2026-01-24 01:49:32.385921	SENT	f	\N	\N
352	3	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:45.948241	2026-01-24 14:39:45.948241	SENT	f	\N	\N
358	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.025265	2026-01-24 14:39:46.025265	SENT	f	\N	\N
364	25	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.107431	2026-01-24 14:39:46.107431	SENT	f	\N	\N
253	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:02:02.800978	2026-01-23 22:02:02.800978	SENT	f	\N	\N
248	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.192984	2026-01-23 22:02:43.679967	SENT	f	\N	\N
250	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.770164	2026-01-23 22:26:43.956818	SENT	f	\N	\N
245	17	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.148785	2026-01-24 01:40:48.729687	SENT	f	\N	\N
256	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.849621	2026-01-24 01:49:32.385921	SENT	f	\N	\N
220	4	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.115913	2026-01-23 22:02:43.679967	SENT	f	\N	\N
230	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.131904	2026-01-23 22:02:43.679967	SENT	f	\N	\N
239	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.431479	2026-01-23 22:02:43.679967	SENT	f	\N	\N
252	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.791146	2026-01-24 01:54:53.853678	SENT	f	\N	\N
249	16	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.213957	2026-01-24 01:58:02.076992	SENT	f	\N	\N
258	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.869758	2026-01-24 01:58:02.076992	SENT	f	\N	\N
246	15	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.167086	2026-01-24 13:07:47.128323	SENT	f	\N	\N
255	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.818116	2026-01-24 13:07:47.128323	SENT	f	\N	\N
353	18	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:45.957195	2026-01-24 14:39:45.957195	SENT	f	\N	\N
359	16	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.049728	2026-01-24 14:39:46.049728	SENT	f	\N	\N
365	26	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.11883	2026-01-24 14:39:46.11883	SENT	f	\N	\N
261	3	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:01.987661	2026-01-24 01:54:53.853678	SENT	f	\N	\N
251	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:02:02.781915	2026-01-23 22:02:02.781915	SENT	f	\N	\N
271	3	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.776963	2026-01-24 01:54:53.853678	SENT	f	\N	\N
280	3	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.224472	2026-01-24 01:54:53.853678	SENT	f	\N	\N
257	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.857789	2026-01-23 22:02:43.679967	SENT	f	\N	\N
267	16	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:02.06553	2026-01-24 01:58:02.076992	SENT	f	\N	\N
260	18	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:05:01.978098	2026-01-23 22:05:01.978098	SENT	f	\N	\N
262	19	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:05:02.001126	2026-01-23 22:05:02.001126	SENT	f	\N	\N
277	16	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.848745	2026-01-24 01:58:02.076992	SENT	f	\N	\N
264	15	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:02.030425	2026-01-24 13:07:47.128323	SENT	f	\N	\N
274	15	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.808577	2026-01-24 13:07:47.128323	SENT	f	\N	\N
283	15	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.258813	2026-01-24 13:07:47.128323	SENT	f	\N	\N
266	4	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:02.052622	2026-01-23 22:10:17.751498	SENT	f	\N	\N
268	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo ngủ xấu'!	event_winner	t	\N	2026-01-23 22:08:14.351799	2026-01-23 22:10:17.751498	SENT	f	\N	\N
354	19	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:45.966305	2026-01-24 14:39:45.966305	SENT	f	\N	\N
270	18	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:17:17.764262	2026-01-23 22:17:17.764262	SENT	f	\N	\N
272	19	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:17:17.788537	2026-01-23 22:17:17.788537	SENT	f	\N	\N
360	15	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.060018	2026-01-24 14:39:46.060018	SENT	f	\N	\N
279	18	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:17:39.20936	2026-01-23 22:17:39.20936	SENT	f	\N	\N
281	19	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:17:39.238062	2026-01-23 22:17:39.238062	SENT	f	\N	\N
276	4	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.829039	2026-01-23 22:21:30.970808	SENT	f	\N	\N
285	4	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.282468	2026-01-23 22:21:30.970808	SENT	f	\N	\N
259	14	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:01.966062	2026-01-23 22:26:43.956818	SENT	f	\N	\N
269	14	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.675583	2026-01-23 22:26:43.956818	SENT	f	\N	\N
278	14	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.196297	2026-01-23 22:26:43.956818	SENT	f	\N	\N
254	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:02:02.809994	2026-01-24 01:40:48.729687	SENT	f	\N	\N
263	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:02.01842	2026-01-24 01:40:48.729687	SENT	f	\N	\N
273	17	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.799078	2026-01-24 01:40:48.729687	SENT	f	\N	\N
247	20	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:16.178839	2026-01-24 01:49:32.385921	SENT	f	\N	\N
265	20	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:05:02.042957	2026-01-24 01:49:32.385921	SENT	f	\N	\N
275	20	🎉 Sự kiện mới!	Sự kiện 'Tesst' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:17:17.81802	2026-01-24 01:49:32.385921	SENT	f	\N	\N
284	20	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.269663	2026-01-24 01:49:32.385921	SENT	f	\N	\N
289	3	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.106445	2026-01-24 01:54:53.853678	SENT	f	\N	\N
288	18	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:21:24.092598	2026-01-23 22:21:24.092598	SENT	f	\N	\N
290	19	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 22:21:24.11583	2026-01-23 22:21:24.11583	SENT	f	\N	\N
299	3	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.61281	2026-01-24 01:54:53.853678	SENT	f	\N	\N
286	16	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.292426	2026-01-24 01:58:02.076992	SENT	f	\N	\N
295	16	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.178883	2026-01-24 01:58:02.076992	SENT	f	\N	\N
294	4	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.158269	2026-01-23 22:21:30.970808	SENT	f	\N	\N
241	14	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:00:15.997593	2026-01-23 22:26:43.956818	SENT	f	\N	\N
287	14	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:23.973855	2026-01-23 22:26:43.956818	SENT	f	\N	\N
304	16	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.67891	2026-01-24 01:58:02.076992	SENT	f	\N	\N
298	18	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:28:25.590235	2026-01-23 22:28:25.590235	SENT	f	\N	\N
300	19	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:28:25.630961	2026-01-23 22:28:25.630961	SENT	f	\N	\N
296	4	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.562787	2026-01-24 02:10:08.688743	SENT	f	\N	\N
309	4	Bạn đã xác nhận cuộc hẹn! 🎉	Cuộc hẹn với bé Bella vào 24/01/2026 22:32 đã được xác nhận	appointment_accepted	t	\N	2026-01-23 22:34:19.885849	2026-01-24 02:10:08.688743	SENT	f	\N	\N
297	14	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.573805	2026-01-23 22:28:30.23937	SENT	f	\N	\N
318	4	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.454304	2026-01-24 02:10:08.688743	SENT	f	\N	\N
320	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé MyMy vừa nhận được vote đầu tiên!	event_vote	t	\N	2026-01-23 22:39:30.710996	2026-01-24 02:10:08.688743	SENT	f	\N	\N
305	14	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé Bella đã giành vị trí Top 1 trong 't'!	event_winner	t	\N	2026-01-23 22:31:06.40722	2026-01-23 22:31:54.220745	SENT	f	\N	\N
306	14	Lời mời gặp gỡ mới! 🐾	Bé Luna muốn hẹn gặp bé Bella vào 24/01/2026 01:00	appointment_invite	t	\N	2026-01-23 22:31:17.906891	2026-01-23 22:31:54.220745	SENT	f	\N	\N
322	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 't'!	event_winner	t	\N	2026-01-23 22:40:02.043553	2026-01-24 02:10:08.688743	SENT	f	\N	\N
307	4	Có đề xuất mới cho cuộc hẹn! 📝	Đối phương đã đề xuất thời gian/địa điểm mới cho cuộc hẹn	appointment_counter_offer	t	\N	2026-01-23 22:32:29.912488	2026-01-23 22:33:24.169731	SENT	f	\N	\N
292	15	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.137381	2026-01-24 13:07:47.128323	SENT	f	\N	\N
302	15	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.64938	2026-01-24 13:07:47.128323	SENT	f	\N	\N
316	15	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.436955	2026-01-24 13:07:47.128323	SENT	f	\N	\N
312	18	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:37:37.398011	2026-01-23 22:37:37.398011	SENT	f	\N	\N
314	19	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 22:37:37.419084	2026-01-23 22:37:37.419084	SENT	f	\N	\N
355	20	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:45.976151	2026-01-24 14:39:45.976151	SENT	f	\N	\N
361	14	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.069956	2026-01-24 14:39:46.069956	SENT	f	\N	\N
311	14	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.389354	2026-01-23 22:39:23.413297	SENT	f	\N	\N
324	18	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 23:03:24.96796	2026-01-23 23:03:24.96796	SENT	f	\N	\N
326	19	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-23 23:03:24.988954	2026-01-23 23:03:24.988954	SENT	f	\N	\N
291	17	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.125527	2026-01-24 01:40:48.729687	SENT	f	\N	\N
301	17	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.639869	2026-01-24 01:40:48.729687	SENT	f	\N	\N
315	17	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.428319	2026-01-24 01:40:48.729687	SENT	f	\N	\N
293	20	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:21:24.148725	2026-01-24 01:49:32.385921	SENT	f	\N	\N
303	20	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:28:25.670515	2026-01-24 01:49:32.385921	SENT	f	\N	\N
317	20	🎉 Sự kiện mới!	Sự kiện 't' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 22:37:37.445721	2026-01-24 01:49:32.385921	SENT	f	\N	\N
338	15	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.807792	2026-01-24 13:07:47.128323	SENT	f	\N	\N
335	19	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 23:04:01.758568	2026-01-23 23:04:01.758568	SENT	f	\N	\N
332	14	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.706577	2026-01-23 23:08:41.02151	SENT	f	\N	\N
356	17	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:45.995162	2026-01-24 14:39:45.995162	SENT	f	\N	\N
362	22	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.082699	2026-01-24 14:39:46.082699	SENT	f	\N	\N
333	18	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	f	\N	2026-01-23 23:04:01.725396	2026-01-23 23:04:01.725396	SENT	f	\N	\N
357	23	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.009412	2026-01-24 14:39:46.009412	SENT	f	\N	\N
363	24	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu nhất' vừa được tạo. Tham gia ngay!	event_created	f	\N	2026-01-24 14:39:46.092473	2026-01-24 14:39:46.092473	SENT	f	\N	\N
336	17	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.770003	2026-01-24 01:40:48.729687	SENT	f	\N	\N
339	20	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.820246	2026-01-24 01:49:32.385921	SENT	f	\N	\N
367	4	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé MyMy đã giành vị trí Top 1 trong 'Mèo ngủ xấu nhất'!	event_winner	f	\N	2026-01-24 14:42:08.407216	2026-01-24 14:42:08.407216	SENT	f	\N	\N
308	14	Cuộc hẹn được xác nhận! 🎉	Bé Luna đã đồng ý gặp gỡ vào 24/01/2026 22:32	appointment_accepted	t	\N	2026-01-23 22:34:19.779141	2026-01-23 23:08:41.02151	SENT	f	\N	\N
310	14	Đối phương đã check-in! 📍	Bé Luna đã đến địa điểm hẹn. Hãy nhanh chân check-in nhé!	appointment_checkin	t	\N	2026-01-23 22:36:39.569369	2026-01-23 23:08:41.02151	SENT	f	\N	\N
323	14	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:24.896927	2026-01-23 23:08:41.02151	SENT	f	\N	\N
334	3	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.746374	2026-01-24 01:54:53.853678	SENT	f	\N	\N
341	14	🏆 Chúc mừng! Bạn đạt Quán quân!	Bé David đã giành vị trí Top 1 trong 'test'!	event_winner	t	\N	2026-01-23 23:10:17.471102	2026-01-23 23:14:32.914216	SENT	f	\N	\N
217	17	🎉 Sự kiện mới!	Sự kiện 'Mèo ngủ xấu' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 21:46:08.075982	2026-01-24 01:40:48.729687	SENT	f	\N	\N
227	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:47:38.110366	2026-01-24 01:40:48.729687	SENT	f	\N	\N
236	17	📝 Sự kiện được cập nhật	Sự kiện 'Mèo ngủ xấu' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 21:49:13.395966	2026-01-24 01:40:48.729687	SENT	f	\N	\N
282	17	📝 Sự kiện được cập nhật	Sự kiện 'Tesst' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 22:17:39.247654	2026-01-24 01:40:48.729687	SENT	f	\N	\N
327	17	🎉 Sự kiện mới!	Sự kiện 'test' vừa được tạo. Tham gia ngay!	event_created	t	\N	2026-01-23 23:03:24.996919	2026-01-24 01:40:48.729687	SENT	f	\N	\N
340	16	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.830234	2026-01-24 01:58:02.076992	SENT	f	\N	\N
337	4	📝 Sự kiện được cập nhật	Sự kiện 'test' đã cập nhật tiêu đề, thời gian bắt đầu, hạn nộp bài, thời gian kết thúc. Xem chi tiết!	event_updated	t	\N	2026-01-23 23:04:01.792852	2026-01-24 02:10:08.688743	SENT	f	\N	\N
342	4	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-24 00:05:06.415237	2026-01-24 02:10:08.688743	SENT	f	\N	\N
343	14	Cuộc hẹn không thành ⚠️	Cuộc hẹn đã bị hủy do không có ai check-in đúng giờ	appointment_no_show	t	\N	2026-01-24 00:05:06.440027	2026-01-24 13:04:42.481067	SENT	f	\N	\N
366	4	❤️ Bài dự thi được yêu thích!	Bài dự thi của bé MyMy vừa nhận được vote đầu tiên!	event_vote	f	\N	2026-01-24 14:40:43.585724	2026-01-24 14:40:43.585724	SENT	f	\N	\N
\.


--
-- TOC entry 3840 (class 0 OID 16767)
-- Dependencies: 252
-- Data for Name: PaymentHistory; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PaymentHistory" ("HistoryId", "UserId", "StatusService", "StartDate", "EndDate", "Amount", "CreatedAt", "UpdatedAt") FROM stdin;
\.


--
-- TOC entry 3823 (class 0 OID 16541)
-- Dependencies: 235
-- Data for Name: Pet; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Pet" ("PetId", "UserId", "Name", "Breed", "Gender", "Age", "IsActive", "IsDeleted", "Description", "CreatedAt", "UpdatedAt") FROM stdin;
1	3	Milo	Golden Retriever	Đực	3	f	f	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
18	14	Bella	Mèo Ba Tư	Cái	\N	t	f	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-20 08:16:53.089525	2026-01-23 23:15:38.808732
19	15	Max	Husky	Đực	\N	t	t	Tính cách hiền lành, thích được vuốt ve và nằm ngủ ở những nơi ấm áp. Phù hợp với những ai yêu sự nhẹ nhàng.	2026-01-20 08:16:53.089525	2026-01-20 15:32:09.867096
20	16	Coco	Mỹ	Cái	\N	t	f	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-20 08:16:53.089525	2026-01-20 15:46:29.95597
21	17	Rocky	Bulldog	Đực	\N	t	t	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-20 08:16:53.089525	2026-01-20 15:53:48.360661
22	18	Kitty	British Shorthair	Cái	\N	t	t	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-20 08:16:53.089525	2026-01-20 15:57:37.536142
42	22	Brandy	Xiêm	Male	\N	t	f	Một chú mèo tinh nghịch, thích chạy nhảy và luôn tò mò với mọi thứ xung quanh. Rất thân thiện và dễ làm quen.	2026-01-24 01:12:48.999174	2026-01-24 01:15:27.793506
2	4	Luna	Poodle	Cái	2	f	f	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-05 13:46:27.838373	2026-01-24 14:45:49.553241
10	4	MyMy	Anh	Male	\N	f	f	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-13 21:29:54.533419	2026-01-24 14:45:49.553244
23	19	Buddy	Beagle	Đực	\N	t	t	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-20 08:16:53.089525	2026-01-20 16:01:01.58109
24	20	Mimi	Ragdoll	Cái	\N	t	t	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-20 08:16:53.089525	2026-01-20 16:03:31.153947
43	23	Cailo	Miến Điện	Male	\N	t	f	Tính cách hiền lành, thích được vuốt ve và nằm ngủ ở những nơi ấm áp. Phù hợp với những ai yêu sự nhẹ nhàng.	2026-01-24 01:17:27.529031	2026-01-24 01:18:11.868237
25	15	Max	Ai Cập	Male	\N	f	t	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-20 15:33:09.091584	2026-01-20 15:39:30.335434
26	15	Max	Ai Cap	Male	\N	f	t	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-20 15:40:34.007128	2026-01-20 15:41:22.072342
44	24	Tiger	Maine Coon	Male	\N	t	f	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-24 01:20:19.094988	2026-01-24 01:21:06.862636
27	15	Max	Egypt	Male	\N	t	f	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-20 15:42:09.04204	2026-01-20 15:42:09.042042
45	25	Daisy	BomBay	Male	\N	t	f	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-24 01:21:55.803206	2026-01-24 01:22:24.609835
46	26	Leo	Somali	Male	\N	t	f	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-24 01:23:40.588666	2026-01-24 01:24:48.935719
30	18	Mad	Hoang Mac	Male	\N	t	f	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-20 15:56:50.692101	2026-01-20 15:56:50.692108
31	19	John	Anh	Male	\N	t	f	Hơi “chảnh” một chút nhưng cực kỳ đáng yêu. Thích quan sát mọi thứ từ xa và chỉ thân thiết với người quen.	2026-01-20 16:00:11.013216	2026-01-20 16:00:11.013216
32	20	Mie	Ragdoll	Male	\N	t	f	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-20 16:02:40.182357	2026-01-20 16:02:40.182358
33	4	Dav	Anh	Male	\N	\N	t	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-23 22:07:09.12684	2026-01-23 22:07:51.112594
34	4	Dav	Anh	Male	\N	f	t	Chú mèo thông minh, nhanh nhẹn và rất thích chơi đồ chơi tương tác. Luôn tạo cảm giác vui vẻ cho chủ.	2026-01-23 22:14:59.355188	2026-01-23 22:15:25.311378
35	4	Dav	Anh	Male	\N	f	t	Tính cách hiền lành, thích được vuốt ve và nằm ngủ ở những nơi ấm áp. Phù hợp với những ai yêu sự nhẹ nhàng.	2026-01-23 22:24:07.957071	2026-01-23 22:26:24.049976
36	14	David	Anh	Male	\N	f	f	Hoạt bát, thân thiện với cả người lạ và các thú cưng khác. Luôn mang lại năng lượng tích cực cho gia đình.	2026-01-23 22:59:46.211479	2026-01-23 23:15:38.80873
47	17	Sofia	Nga	Male	\N	f	f	\N	2026-01-24 01:45:52.745295	2026-01-24 01:45:52.745299
48	15	Dav	Anh	Male	\N	f	t	kkkk	2026-01-24 14:43:40.036716	2026-01-24 14:43:52.749922
49	4	Deb	Anh	Male	\N	t	f	kkk	2026-01-24 14:43:58.98705	2026-01-24 14:45:49.553255
\.


--
-- TOC entry 3860 (class 0 OID 17081)
-- Dependencies: 272
-- Data for Name: PetAppointment; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PetAppointment" ("AppointmentId", "MatchId", "InviterPetId", "InviteePetId", "InviterUserId", "InviteeUserId", "AppointmentDateTime", "LocationId", "ActivityType", "Status", "CurrentDecisionUserId", "CounterOfferCount", "InviterCheckedIn", "InviteeCheckedIn", "InviterCheckInTime", "InviteeCheckInTime", "CancelledBy", "CancelReason", "CreatedAt", "UpdatedAt") FROM stdin;
3	1	2	1	4	3	2026-01-09 07:00:39.426	11	cafe	cancelled	3	0	f	f	\N	\N	4	ab	2026-01-09 04:04:32.64282	2026-01-09 04:18:32.800456
4	1	2	1	4	3	2026-01-09 21:00:40.96	12	cafe	completed	\N	2	t	t	2026-01-09 20:40:51.021814	2026-01-09 20:37:36.276675	\N	\N	2026-01-09 17:34:06.489402	2026-01-09 21:09:50.355867
13	1	2	1	4	3	2026-01-14 00:50:36.978	15	cafe	completed	\N	0	t	t	2026-01-14 00:51:54.3094	2026-01-14 00:49:55.045817	3	\N	2026-01-14 00:40:49.615241	2026-01-14 00:53:09.655591
5	1	2	1	4	3	2026-01-10 23:50:47.275	12	cafe	cancelled	\N	3	f	f	\N	\N	4	Co viec rieng	2026-01-09 21:49:30.794259	2026-01-09 21:53:46.354087
14	1	1	2	3	4	2026-01-14 23:00:35.915	16	cafe	no_show	\N	0	f	f	\N	\N	\N	\N	2026-01-14 20:41:11.393879	2026-01-15 00:32:36.843214
6	1	2	1	4	3	2026-01-10 00:00:15.961	11	cafe	cancelled	\N	0	f	f	\N	\N	3	Co viec rieng	2026-01-09 21:54:33.949302	2026-01-09 21:55:16.218762
15	1	2	1	4	3	2026-01-23 16:00:28.663	17	cafe	cancelled	\N	0	f	f	\N	\N	4	Ban roi (Hủy sát giờ)	2026-01-23 06:35:24.163781	2026-01-23 14:51:54.27964
16	7	18	2	14	4	2026-01-23 16:00:01.54	18	cafe	expired	4	0	f	f	\N	\N	\N	\N	2026-01-23 06:49:46.473927	2026-01-23 16:04:54.235843
7	1	2	1	4	3	2026-01-09 20:30:43.31	12	cafe	no_show	\N	0	f	t	\N	2026-01-09 21:59:07.825967	\N	\N	2026-01-09 21:56:50.524877	2026-01-09 22:02:49.27989
17	1	2	1	4	3	2026-01-23 17:00:36.886	19	cafe	expired	3	0	f	f	\N	\N	\N	\N	2026-01-23 14:52:51.494902	2026-01-23 17:04:56.494314
8	1	1	2	3	4	2026-01-09 20:00:33.548	11	cafe	no_show	\N	0	f	f	\N	\N	\N	\N	2026-01-09 22:11:40.050284	2026-01-09 22:16:17.382334
18	7	2	18	4	14	2026-01-23 22:30:13.951	20	cafe	no_show	\N	1	t	f	2026-01-23 22:36:39.562151	\N	\N	\N	2026-01-23 22:31:17.842322	2026-01-24 00:05:06.368061
19	7	2	18	4	14	2026-01-24 14:00:07.459	21	cafe	no_show	\N	0	t	f	2026-01-24 14:37:39.864172	\N	\N	\N	2026-01-24 02:17:02.91283	2026-01-24 15:30:11.186227
20	10	2	27	4	15	2026-01-24 17:00:00	22	cafe	no_show	\N	0	f	f	\N	\N	\N	\N	2026-01-24 14:33:54.330078	2026-01-24 18:30:12.066486
\.


--
-- TOC entry 3858 (class 0 OID 17064)
-- Dependencies: 270
-- Data for Name: PetAppointmentLocation; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PetAppointmentLocation" ("LocationId", "Name", "Address", "Latitude", "Longitude", "City", "District", "IsPetFriendly", "PlaceType", "GooglePlaceId", "CreatedAt", "UpdatedAt") FROM stdin;
1	Pet Café Chó Mèo Thành Phố	123 Nguyễn Huệ, Quận 1	10.773831	106.704895	Hồ Chí Minh	Quận 1	t	pet_cafe	\N	2026-01-08 18:21:00.979732	2026-01-08 18:21:00.979732
2	Công Viên Tao Đàn	Cách Mạng Tháng 8, Quận 3	10.775320	106.692320	Hồ Chí Minh	Quận 3	t	park	\N	2026-01-08 18:21:00.979732	2026-01-08 18:21:00.979732
3	Puppy Station Coffee	456 Lê Văn Sỹ, Quận 3	10.786547	106.678123	Hồ Chí Minh	Quận 3	t	pet_cafe	\N	2026-01-08 18:21:00.979732	2026-01-08 18:21:00.979732
4	Công Viên Gia Định	Hoàng Minh Giám, Phú Nhuận	10.800123	106.685432	Hồ Chí Minh	Phú Nhuận	t	park	\N	2026-01-08 18:21:00.979732	2026-01-08 18:21:00.979732
5	The Paw House	789 Phan Xích Long, Phú Nhuận	10.795678	106.680234	Hồ Chí Minh	Phú Nhuận	t	pet_cafe	\N	2026-01-08 18:21:00.979732	2026-01-08 18:21:00.979732
11	Cafe Dieu Thuyen	Phố Lê Hồng Phong, Phường Hà Đông, Hà Nội, 10189, Việt Nam	20.966479	105.773671	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-09 04:04:32.471542	2026-01-09 04:04:32.471544
12	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-09 17:34:06.120251	2026-01-09 17:34:06.120297
13	An's Garden Cafe	An's Garden Cafe, Đường 19 tháng 5, Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977407	105.792284	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-11 21:15:31.845887	2026-01-11 21:15:31.845918
14	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-14 00:29:04.835606	2026-01-14 00:29:04.835626
15	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-14 00:40:49.352625	2026-01-14 00:40:49.352663
16	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-14 20:41:11.173623	2026-01-14 20:41:11.173643
17	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-23 06:35:23.961395	2026-01-23 06:35:23.96141
18	An's Garden Cafe	An's Garden Cafe, Đường 19 tháng 5, Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977401	105.792289	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-23 06:49:46.454994	2026-01-23 06:49:46.454996
19	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-23 14:52:51.301773	2026-01-23 14:52:51.301814
20	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-23 22:31:17.783581	2026-01-23 22:31:17.783616
21	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-24 02:17:02.753439	2026-01-24 02:17:02.753462
22	Laika Café	Khu đô thị Văn Quán, Phường Hà Đông, Hà Nội, 12011, Việt Nam	20.977369	105.792209	Hà Nội	Phường Hà Đông	t	custom	\N	2026-01-24 14:33:54.304267	2026-01-24 14:33:54.30427
\.


--
-- TOC entry 3826 (class 0 OID 16583)
-- Dependencies: 238
-- Data for Name: PetCharacteristic; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PetCharacteristic" ("PetId", "AttributeId", "OptionId", "Value", "CreatedAt", "UpdatedAt") FROM stdin;
19	6	\N	22	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
19	17	\N	55	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
19	13	\N	4	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
19	3	12	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
19	4	18	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
19	15	55	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	6	\N	25	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	17	\N	40	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	13	\N	3	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	3	16	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	4	17	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
21	15	55	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
22	6	\N	5	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
22	17	\N	30	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
22	13	\N	2	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
22	3	12	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
22	4	17	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
10	1	2	\N	2026-01-13 21:30:37.669148	2026-01-13 21:39:57.933077
10	2	6	\N	2026-01-13 21:30:37.681384	2026-01-13 21:39:57.946703
10	8	32	\N	2026-01-13 21:30:38.077516	2026-01-13 21:39:58.22685
10	7	26	\N	2026-01-13 21:30:38.073047	2026-01-13 21:39:58.228167
10	9	34	\N	2026-01-13 21:30:38.104736	2026-01-13 21:39:58.512425
10	10	40	\N	2026-01-13 21:30:38.457206	2026-01-13 21:39:58.534801
10	11	47	\N	2026-01-13 21:30:38.446357	2026-01-13 21:39:58.815109
10	12	52	\N	2026-01-13 21:30:38.450962	2026-01-13 21:39:58.841929
10	3	16	\N	2026-01-13 21:30:37.741227	2026-01-13 21:39:58.958711
10	6	\N	4	2026-01-13 21:30:38.810936	2026-01-13 21:39:59.084765
10	15	55	\N	2026-01-13 21:30:38.460463	2026-01-13 21:39:59.106807
10	13	\N	3	2026-01-13 21:30:38.822885	2026-01-13 21:39:59.200625
10	17	\N	30	2026-01-13 21:38:54.080837	2026-01-13 21:39:59.326642
10	4	17	\N	2026-01-13 21:30:37.705172	2026-01-13 21:40:00.270877
10	5	20	\N	2026-01-13 21:30:39.337677	2026-01-13 21:40:00.397751
22	15	56	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	6	\N	12	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	17	\N	38	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	13	\N	3	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	3	16	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	4	17	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
23	15	55	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	6	\N	4	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	17	\N	28	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	13	\N	1	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	3	8	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	4	19	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
24	15	56	\N	2026-01-20 08:19:25.821935	2026-01-20 08:19:25.821935
2	2	5	\N	2026-01-20 15:27:17.242478	2026-01-20 15:27:17.242456
2	1	1	\N	2026-01-20 15:27:17.246926	2026-01-20 15:27:17.246925
2	4	17	\N	2026-01-20 15:27:17.367131	2026-01-20 15:27:17.36713
2	3	9	\N	2026-01-20 15:27:17.381976	2026-01-20 15:27:17.381975
2	5	20	\N	2026-01-20 15:27:17.442671	2026-01-20 15:27:17.44267
2	7	24	\N	2026-01-20 15:27:17.69439	2026-01-20 15:27:17.694389
2	8	28	\N	2026-01-20 15:27:17.722642	2026-01-20 15:27:17.722641
2	10	41	\N	2026-01-20 15:27:17.732752	2026-01-20 15:27:17.732751
2	9	35	\N	2026-01-20 15:27:17.73477	2026-01-20 15:27:17.734769
2	11	45	\N	2026-01-20 15:27:17.797365	2026-01-20 15:27:17.797364
2	17	\N	35	2026-01-05 13:46:27.838373	2026-01-20 15:27:18.056623
2	6	\N	8	2026-01-05 13:46:27.838373	2026-01-20 15:27:18.056623
2	12	51	\N	2026-01-20 15:27:18.095255	2026-01-20 15:27:18.095254
2	15	56	\N	2026-01-20 15:27:18.14025	2026-01-20 15:27:18.14025
2	13	\N	3	2026-01-20 15:27:18.148575	2026-01-20 15:27:18.148574
18	5	20	\N	2026-01-20 15:31:03.349012	2026-01-23 22:58:03.820878
18	7	24	\N	2026-01-20 15:31:03.649544	2026-01-23 22:58:03.901378
18	17	\N	30	2026-01-20 08:19:25.821935	2026-01-23 22:58:04.37751
18	10	41	\N	2026-01-20 15:31:03.710797	2026-01-23 22:58:04.564985
18	4	19	\N	2026-01-20 08:19:25.821935	2026-01-23 22:58:03.783079
18	13	\N	2	2026-01-20 08:19:25.821935	2026-01-23 22:58:04.377187
25	1	2	\N	2026-01-20 15:37:00.614695	2026-01-20 15:37:00.614694
25	7	25	\N	2026-01-20 15:37:00.977478	2026-01-20 15:37:00.977476
25	8	32	\N	2026-01-20 15:37:01.337791	2026-01-20 15:37:01.33779
25	5	23	\N	2026-01-20 15:37:01.421426	2026-01-20 15:37:01.421424
25	4	17	\N	2026-01-20 15:37:01.491261	2026-01-20 15:37:01.49126
25	9	34	\N	2026-01-20 15:37:01.697327	2026-01-20 15:37:01.697325
25	10	40	\N	2026-01-20 15:37:01.801907	2026-01-20 15:37:01.801906
25	11	47	\N	2026-01-20 15:37:01.86706	2026-01-20 15:37:01.867059
25	12	52	\N	2026-01-20 15:37:02.067774	2026-01-20 15:37:02.067774
25	2	6	\N	2026-01-20 15:37:02.155062	2026-01-20 15:37:02.155061
25	15	55	\N	2026-01-20 15:37:02.183398	2026-01-20 15:37:02.183397
25	6	\N	4	2026-01-20 15:37:02.243285	2026-01-20 15:37:02.243284
25	3	9	\N	2026-01-20 15:37:02.352929	2026-01-20 15:37:02.352928
25	13	\N	5	2026-01-20 15:37:02.475028	2026-01-20 15:37:02.475027
25	17	\N	35	2026-01-20 15:37:02.529425	2026-01-20 15:37:02.529424
26	1	2	\N	2026-01-20 15:41:14.211365	2026-01-20 15:41:14.211364
26	4	17	\N	2026-01-20 15:41:14.278899	2026-01-20 15:41:14.278898
26	3	9	\N	2026-01-20 15:41:14.282984	2026-01-20 15:41:14.282984
26	2	6	\N	2026-01-20 15:41:14.28304	2026-01-20 15:41:14.283039
26	5	23	\N	2026-01-20 15:41:14.300232	2026-01-20 15:41:14.300231
26	7	25	\N	2026-01-20 15:41:14.550402	2026-01-20 15:41:14.550401
26	9	34	\N	2026-01-20 15:41:14.649302	2026-01-20 15:41:14.649301
26	8	32	\N	2026-01-20 15:41:14.647257	2026-01-20 15:41:14.647256
26	11	47	\N	2026-01-20 15:41:14.707526	2026-01-20 15:41:14.707525
26	10	40	\N	2026-01-20 15:41:14.708822	2026-01-20 15:41:14.708822
26	12	51	\N	2026-01-20 15:41:15.056587	2026-01-20 15:41:15.056586
26	6	\N	5	2026-01-20 15:41:15.108372	2026-01-20 15:41:15.108371
26	15	55	\N	2026-01-20 15:41:15.129152	2026-01-20 15:41:15.129152
26	13	\N	3	2026-01-20 15:41:15.167458	2026-01-20 15:41:15.167458
26	17	\N	35	2026-01-20 15:41:15.182055	2026-01-20 15:41:15.182054
27	2	6	\N	2026-01-20 15:42:44.920058	2026-01-20 15:42:44.920057
27	1	2	\N	2026-01-20 15:42:44.950519	2026-01-20 15:42:44.950518
27	3	9	\N	2026-01-20 15:42:45.011179	2026-01-20 15:42:45.011178
27	5	23	\N	2026-01-20 15:42:45.036411	2026-01-20 15:42:45.03641
27	4	17	\N	2026-01-20 15:42:45.069808	2026-01-20 15:42:45.069807
27	7	25	\N	2026-01-20 15:42:45.273865	2026-01-20 15:42:45.273864
27	8	32	\N	2026-01-20 15:42:45.320667	2026-01-20 15:42:45.320666
27	9	34	\N	2026-01-20 15:42:45.390283	2026-01-20 15:42:45.390282
27	10	40	\N	2026-01-20 15:42:45.40481	2026-01-20 15:42:45.404808
27	11	47	\N	2026-01-20 15:42:45.449864	2026-01-20 15:42:45.449863
27	12	52	\N	2026-01-20 15:42:45.673652	2026-01-20 15:42:45.673636
27	15	55	\N	2026-01-20 15:42:45.721612	2026-01-20 15:42:45.721612
27	6	\N	4	2026-01-20 15:42:45.754362	2026-01-20 15:42:45.754361
27	13	\N	3	2026-01-20 15:42:45.797516	2026-01-20 15:42:45.797515
20	1	1	\N	2026-01-20 15:49:00.39322	2026-01-20 15:49:00.393219
20	2	5	\N	2026-01-20 15:49:00.439589	2026-01-20 15:49:00.439588
20	7	24	\N	2026-01-20 15:49:00.740362	2026-01-20 15:49:00.740361
20	8	28	\N	2026-01-20 15:49:00.85297	2026-01-20 15:49:00.852969
20	3	10	\N	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.161664
20	9	34	\N	2026-01-20 15:49:01.204205	2026-01-20 15:49:01.204204
20	10	40	\N	2026-01-20 15:49:01.269917	2026-01-20 15:49:01.269916
20	4	17	\N	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.273371
20	6	\N	3	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.507233
20	13	\N	2	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.566395
20	15	56	\N	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.573277
20	17	\N	25	2026-01-20 08:19:25.821935	2026-01-20 15:49:01.745855
18	9	34	\N	2026-01-20 15:31:03.66679	2026-01-23 22:58:04.07142
18	8	28	\N	2026-01-20 15:31:03.664014	2026-01-23 22:58:04.071301
18	12	54	\N	2026-01-20 15:31:03.979207	2026-01-23 22:58:04.260434
18	11	46	\N	2026-01-20 15:31:03.687428	2026-01-23 22:58:04.259862
1	6	\N	6	2026-01-05 13:46:27.838373	2026-01-24 01:54:43.806069
18	15	56	\N	2026-01-20 08:19:25.821935	2026-01-23 22:58:04.356803
18	6	\N	8	2026-01-20 08:19:25.821935	2026-01-23 22:58:04.355419
1	17	\N	37	2026-01-05 13:46:27.838373	2026-01-24 01:54:43.806075
27	17	\N	35	2026-01-20 15:42:45.8457	2026-01-20 15:42:45.845699
20	5	20	\N	2026-01-20 15:49:01.322167	2026-01-20 15:49:01.322166
20	11	45	\N	2026-01-20 15:49:01.506704	2026-01-20 15:49:01.506703
20	12	51	\N	2026-01-20 15:49:01.534622	2026-01-20 15:49:01.534621
30	2	5	\N	2026-01-20 15:57:30.218462	2026-01-20 15:57:30.218461
30	8	31	\N	2026-01-20 15:57:30.561965	2026-01-20 15:57:30.561964
30	6	\N	4	2026-01-20 15:57:30.919608	2026-01-20 15:57:30.919607
31	3	12	\N	2026-01-20 16:00:53.975377	2026-01-20 16:00:53.975376
31	7	25	\N	2026-01-20 16:00:54.227816	2026-01-20 16:00:54.227815
31	11	47	\N	2026-01-20 16:00:54.630941	2026-01-20 16:00:54.630939
31	13	\N	4	2026-01-20 16:00:55.0859	2026-01-20 16:00:55.085899
30	1	1	\N	2026-01-20 15:57:30.182539	2026-01-20 15:57:30.182538
30	3	10	\N	2026-01-20 15:57:30.23404	2026-01-20 15:57:30.234039
30	4	19	\N	2026-01-20 15:57:30.240177	2026-01-20 15:57:30.240176
30	5	22	\N	2026-01-20 15:57:30.27408	2026-01-20 15:57:30.274079
30	7	25	\N	2026-01-20 15:57:30.511837	2026-01-20 15:57:30.511836
30	9	38	\N	2026-01-20 15:57:30.575586	2026-01-20 15:57:30.575585
30	10	40	\N	2026-01-20 15:57:30.586674	2026-01-20 15:57:30.586673
30	11	46	\N	2026-01-20 15:57:30.591295	2026-01-20 15:57:30.591294
30	12	52	\N	2026-01-20 15:57:30.833878	2026-01-20 15:57:30.833877
30	15	55	\N	2026-01-20 15:57:30.902953	2026-01-20 15:57:30.902953
30	13	\N	3	2026-01-20 15:57:30.902636	2026-01-20 15:57:30.902635
30	17	\N	25	2026-01-20 15:57:30.941928	2026-01-20 15:57:30.941927
31	1	1	\N	2026-01-20 16:00:53.886302	2026-01-20 16:00:53.886301
31	2	5	\N	2026-01-20 16:00:53.931306	2026-01-20 16:00:53.931305
31	4	17	\N	2026-01-20 16:00:53.97935	2026-01-20 16:00:53.979349
31	8	33	\N	2026-01-20 16:00:54.263364	2026-01-20 16:00:54.263363
31	10	40	\N	2026-01-20 16:00:54.331071	2026-01-20 16:00:54.33107
31	9	34	\N	2026-01-20 16:00:54.349796	2026-01-20 16:00:54.349795
31	12	52	\N	2026-01-20 16:00:54.636244	2026-01-20 16:00:54.636244
31	5	20	\N	2026-01-20 16:00:54.734708	2026-01-20 16:00:54.734707
31	15	55	\N	2026-01-20 16:00:54.832637	2026-01-20 16:00:54.832636
31	6	\N	6	2026-01-20 16:00:54.930239	2026-01-20 16:00:54.930237
31	17	\N	35	2026-01-20 16:00:55.093492	2026-01-20 16:00:55.09349
32	1	2	\N	2026-01-20 16:03:24.052368	2026-01-20 16:03:24.052367
32	2	6	\N	2026-01-20 16:03:24.083557	2026-01-20 16:03:24.083556
32	3	16	\N	2026-01-20 16:03:24.124204	2026-01-20 16:03:24.124203
32	5	20	\N	2026-01-20 16:03:24.137534	2026-01-20 16:03:24.137533
32	4	19	\N	2026-01-20 16:03:24.148381	2026-01-20 16:03:24.14838
32	8	31	\N	2026-01-20 16:03:24.440725	2026-01-20 16:03:24.440724
32	7	25	\N	2026-01-20 16:03:24.41432	2026-01-20 16:03:24.414319
32	9	34	\N	2026-01-20 16:03:24.632396	2026-01-20 16:03:24.632395
32	10	43	\N	2026-01-20 16:03:24.633301	2026-01-20 16:03:24.633301
32	11	47	\N	2026-01-20 16:03:24.633397	2026-01-20 16:03:24.633397
32	12	52	\N	2026-01-20 16:03:24.933938	2026-01-20 16:03:24.933937
32	15	56	\N	2026-01-20 16:03:25.058359	2026-01-20 16:03:25.058358
32	13	\N	3	2026-01-20 16:03:25.101877	2026-01-20 16:03:25.101876
32	6	\N	6	2026-01-20 16:03:25.10658	2026-01-20 16:03:25.106579
32	17	\N	30	2026-01-20 16:03:25.110177	2026-01-20 16:03:25.110176
35	1	1	\N	2026-01-23 22:26:16.39448	2026-01-23 22:26:16.39446
35	3	9	\N	2026-01-23 22:26:16.412561	2026-01-23 22:26:16.412559
35	4	17	\N	2026-01-23 22:26:16.423366	2026-01-23 22:26:16.423363
35	8	33	\N	2026-01-23 22:26:16.572467	2026-01-23 22:26:16.572466
35	7	25	\N	2026-01-23 22:26:16.571505	2026-01-23 22:26:16.571503
35	9	34	\N	2026-01-23 22:26:16.590326	2026-01-23 22:26:16.590324
35	11	47	\N	2026-01-23 22:26:16.69867	2026-01-23 22:26:16.698668
35	10	40	\N	2026-01-23 22:26:16.701856	2026-01-23 22:26:16.701854
35	12	52	\N	2026-01-23 22:26:16.714518	2026-01-23 22:26:16.714516
35	2	5	\N	2026-01-23 22:26:16.772247	2026-01-23 22:26:16.772244
35	15	55	\N	2026-01-23 22:26:16.949106	2026-01-23 22:26:16.949103
35	6	\N	6	2026-01-23 22:26:16.957816	2026-01-23 22:26:16.957814
35	13	\N	20	2026-01-23 22:26:16.965785	2026-01-23 22:26:16.965783
35	5	20	\N	2026-01-23 22:26:17.057801	2026-01-23 22:26:17.057798
35	17	\N	45	2026-01-23 22:26:17.059062	2026-01-23 22:26:17.059061
18	3	12	\N	2026-01-20 08:19:25.821935	2026-01-23 22:58:03.783065
18	2	6	\N	2026-01-20 15:31:03.341547	2026-01-23 22:58:03.749709
18	1	1	\N	2026-01-20 15:31:03.313139	2026-01-23 22:58:03.749699
36	2	5	\N	2026-01-23 23:00:40.730315	2026-01-23 23:00:40.730312
36	1	1	\N	2026-01-23 23:00:40.747497	2026-01-23 23:00:40.747493
36	3	10	\N	2026-01-23 23:00:40.748038	2026-01-23 23:00:40.748035
36	4	19	\N	2026-01-23 23:00:40.757594	2026-01-23 23:00:40.75759
36	5	22	\N	2026-01-23 23:00:40.757147	2026-01-23 23:00:40.757141
36	8	31	\N	2026-01-23 23:00:40.847475	2026-01-23 23:00:40.847471
36	7	25	\N	2026-01-23 23:00:40.880211	2026-01-23 23:00:40.880207
36	9	38	\N	2026-01-23 23:00:40.911394	2026-01-23 23:00:40.911389
36	10	40	\N	2026-01-23 23:00:40.951741	2026-01-23 23:00:40.951735
36	11	46	\N	2026-01-23 23:00:40.997737	2026-01-23 23:00:40.997732
36	12	51	\N	2026-01-23 23:00:41.026202	2026-01-23 23:00:41.026197
36	15	55	\N	2026-01-23 23:00:41.081365	2026-01-23 23:00:41.081361
36	6	\N	4	2026-01-23 23:00:41.166108	2026-01-23 23:00:41.166103
36	17	\N	30	2026-01-23 23:00:41.326907	2026-01-23 23:00:41.326903
36	13	\N	3	2026-01-23 23:00:41.355214	2026-01-23 23:00:41.355208
42	3	16	\N	2026-01-24 01:14:55.762101	2026-01-24 01:14:55.762083
42	2	6	\N	2026-01-24 01:14:55.771802	2026-01-24 01:14:55.7718
42	5	20	\N	2026-01-24 01:14:55.772001	2026-01-24 01:14:55.771999
42	9	34	\N	2026-01-24 01:14:55.986516	2026-01-24 01:14:55.986513
42	7	25	\N	2026-01-24 01:14:55.986553	2026-01-24 01:14:55.986552
42	8	31	\N	2026-01-24 01:14:55.99193	2026-01-24 01:14:55.991927
42	10	43	\N	2026-01-24 01:14:56.243317	2026-01-24 01:14:56.243315
42	12	52	\N	2026-01-24 01:14:56.245951	2026-01-24 01:14:56.245949
42	11	47	\N	2026-01-24 01:14:56.248987	2026-01-24 01:14:56.248984
42	15	55	\N	2026-01-24 01:14:56.353115	2026-01-24 01:14:56.353112
42	13	\N	3	2026-01-24 01:14:56.440698	2026-01-24 01:14:56.440695
42	6	\N	4	2026-01-24 01:14:56.440707	2026-01-24 01:14:56.440706
42	17	\N	28	2026-01-24 01:14:56.469713	2026-01-24 01:14:56.46971
42	4	17	\N	2026-01-24 01:14:57.254873	2026-01-24 01:14:57.254871
42	1	2	\N	2026-01-24 01:14:57.25884	2026-01-24 01:14:57.258837
43	1	2	\N	2026-01-24 01:18:03.777676	2026-01-24 01:18:03.777673
43	5	20	\N	2026-01-24 01:18:03.937652	2026-01-24 01:18:03.937649
43	4	19	\N	2026-01-24 01:18:03.941738	2026-01-24 01:18:03.941735
43	2	6	\N	2026-01-24 01:18:03.942836	2026-01-24 01:18:03.942835
43	9	34	\N	2026-01-24 01:18:05.264028	2026-01-24 01:18:05.264026
43	8	31	\N	2026-01-24 01:18:05.264791	2026-01-24 01:18:05.26479
43	6	\N	4	2026-01-24 01:18:05.268688	2026-01-24 01:18:05.268686
43	3	16	\N	2026-01-24 01:18:05.450456	2026-01-24 01:18:05.450453
43	12	52	\N	2026-01-24 01:18:05.565781	2026-01-24 01:18:05.56578
43	10	43	\N	2026-01-24 01:18:05.565252	2026-01-24 01:18:05.56525
43	11	47	\N	2026-01-24 01:18:05.571693	2026-01-24 01:18:05.57169
43	15	55	\N	2026-01-24 01:18:05.670684	2026-01-24 01:18:05.670682
43	13	\N	3	2026-01-24 01:18:05.760652	2026-01-24 01:18:05.76065
43	17	\N	35	2026-01-24 01:18:05.891803	2026-01-24 01:18:05.8918
43	7	25	\N	2026-01-24 01:18:05.894019	2026-01-24 01:18:05.894016
44	1	2	\N	2026-01-24 01:21:00.512575	2026-01-24 01:21:00.512573
44	2	6	\N	2026-01-24 01:21:00.538255	2026-01-24 01:21:00.538253
44	3	16	\N	2026-01-24 01:21:00.556105	2026-01-24 01:21:00.556103
44	8	32	\N	2026-01-24 01:21:00.628184	2026-01-24 01:21:00.628182
44	9	34	\N	2026-01-24 01:21:00.663777	2026-01-24 01:21:00.663775
44	10	43	\N	2026-01-24 01:21:00.727791	2026-01-24 01:21:00.727789
44	13	\N	4	2026-01-24 01:21:00.93143	2026-01-24 01:21:00.931428
44	17	\N	40	2026-01-24 01:21:00.937745	2026-01-24 01:21:00.937743
44	4	19	\N	2026-01-24 01:21:01.182913	2026-01-24 01:21:01.18291
44	7	25	\N	2026-01-24 01:21:00.614225	2026-01-24 01:21:00.614223
44	11	47	\N	2026-01-24 01:21:00.757101	2026-01-24 01:21:00.757099
44	15	55	\N	2026-01-24 01:21:00.838479	2026-01-24 01:21:00.838476
44	6	\N	10	2026-01-24 01:21:00.84693	2026-01-24 01:21:00.846924
44	5	22	\N	2026-01-24 01:21:02.08323	2026-01-24 01:21:02.083228
44	12	52	\N	2026-01-24 01:21:02.250221	2026-01-24 01:21:02.250218
45	1	1	\N	2026-01-24 01:22:19.703092	2026-01-24 01:22:19.70309
45	2	6	\N	2026-01-24 01:22:19.716284	2026-01-24 01:22:19.716282
45	3	11	\N	2026-01-24 01:22:19.736762	2026-01-24 01:22:19.73676
45	4	17	\N	2026-01-24 01:22:19.757728	2026-01-24 01:22:19.757726
45	5	20	\N	2026-01-24 01:22:19.764932	2026-01-24 01:22:19.76493
45	7	25	\N	2026-01-24 01:22:19.846701	2026-01-24 01:22:19.846699
45	10	41	\N	2026-01-24 01:22:19.861242	2026-01-24 01:22:19.86124
45	8	30	\N	2026-01-24 01:22:19.868294	2026-01-24 01:22:19.868292
45	11	47	\N	2026-01-24 01:22:19.948233	2026-01-24 01:22:19.94823
45	9	34	\N	2026-01-24 01:22:19.958132	2026-01-24 01:22:19.95813
45	12	52	\N	2026-01-24 01:22:20.045111	2026-01-24 01:22:20.045108
45	15	56	\N	2026-01-24 01:22:20.052402	2026-01-24 01:22:20.0524
45	6	\N	4	2026-01-24 01:22:20.058315	2026-01-24 01:22:20.058313
45	13	\N	3	2026-01-24 01:22:20.06167	2026-01-24 01:22:20.061668
45	17	\N	35	2026-01-24 01:22:20.146528	2026-01-24 01:22:20.146525
46	1	2	\N	2026-01-24 01:24:43.09369	2026-01-24 01:24:43.093688
46	2	6	\N	2026-01-24 01:24:43.107058	2026-01-24 01:24:43.107056
46	3	16	\N	2026-01-24 01:24:43.12772	2026-01-24 01:24:43.127718
46	4	18	\N	2026-01-24 01:24:43.147603	2026-01-24 01:24:43.147599
46	5	20	\N	2026-01-24 01:24:43.163795	2026-01-24 01:24:43.163793
46	7	25	\N	2026-01-24 01:24:43.280024	2026-01-24 01:24:43.280022
46	9	34	\N	2026-01-24 01:24:43.284018	2026-01-24 01:24:43.284018
46	8	32	\N	2026-01-24 01:24:43.283229	2026-01-24 01:24:43.283227
46	10	43	\N	2026-01-24 01:24:43.348187	2026-01-24 01:24:43.348185
46	11	47	\N	2026-01-24 01:24:43.34819	2026-01-24 01:24:43.348189
46	12	51	\N	2026-01-24 01:24:43.560616	2026-01-24 01:24:43.560614
46	17	\N	36	2026-01-24 01:24:43.562757	2026-01-24 01:24:43.562756
46	6	\N	4	2026-01-24 01:24:43.561988	2026-01-24 01:24:43.561986
46	13	\N	3	2026-01-24 01:24:43.603354	2026-01-24 01:24:43.603353
46	15	55	\N	2026-01-24 01:24:43.603354	2026-01-24 01:24:43.603352
47	2	6	\N	2026-01-24 01:46:33.200775	2026-01-24 01:46:33.200773
47	4	19	\N	2026-01-24 01:46:33.241999	2026-01-24 01:46:33.241996
47	5	20	\N	2026-01-24 01:46:33.274256	2026-01-24 01:46:33.274254
47	8	31	\N	2026-01-24 01:46:33.351861	2026-01-24 01:46:33.351847
47	9	34	\N	2026-01-24 01:46:33.415454	2026-01-24 01:46:33.415451
47	10	43	\N	2026-01-24 01:46:33.532237	2026-01-24 01:46:33.532235
47	1	2	\N	2026-01-24 01:46:33.184407	2026-01-24 01:46:33.184405
47	11	47	\N	2026-01-24 01:46:33.760006	2026-01-24 01:46:33.760003
47	3	16	\N	2026-01-24 01:46:33.851687	2026-01-24 01:46:33.851685
47	7	25	\N	2026-01-24 01:46:33.857411	2026-01-24 01:46:33.857408
47	15	56	\N	2026-01-24 01:46:33.948753	2026-01-24 01:46:33.948751
47	6	\N	6	2026-01-24 01:46:34.146074	2026-01-24 01:46:34.146071
47	13	\N	2	2026-01-24 01:46:34.155661	2026-01-24 01:46:34.155659
47	12	52	\N	2026-01-24 01:46:34.156246	2026-01-24 01:46:34.156246
47	17	\N	28	2026-01-24 01:46:34.671566	2026-01-24 01:46:34.671563
1	1	1	\N	2026-01-24 01:54:43.295807	2026-01-24 01:54:43.295805
1	2	6	\N	2026-01-24 01:54:43.387896	2026-01-24 01:54:43.387893
1	3	8	\N	2026-01-24 01:54:43.450694	2026-01-24 01:54:43.450692
1	4	17	\N	2026-01-24 01:54:43.4616	2026-01-24 01:54:43.461597
1	5	22	\N	2026-01-24 01:54:43.470241	2026-01-24 01:54:43.470239
1	8	31	\N	2026-01-24 01:54:43.613374	2026-01-24 01:54:43.613372
1	7	25	\N	2026-01-24 01:54:43.616865	2026-01-24 01:54:43.616862
1	10	41	\N	2026-01-24 01:54:43.663277	2026-01-24 01:54:43.663274
1	11	45	\N	2026-01-24 01:54:43.668319	2026-01-24 01:54:43.668316
1	9	35	\N	2026-01-24 01:54:43.671653	2026-01-24 01:54:43.671651
1	12	51	\N	2026-01-24 01:54:43.757236	2026-01-24 01:54:43.757233
1	13	\N	5	2026-01-24 01:54:43.813106	2026-01-24 01:54:43.813104
1	15	56	\N	2026-01-24 01:54:43.846208	2026-01-24 01:54:43.846206
49	1	1	\N	2026-01-24 14:45:42.78135	2026-01-24 14:45:42.781347
49	2	6	\N	2026-01-24 14:45:42.867427	2026-01-24 14:45:42.867425
49	7	25	\N	2026-01-24 14:45:42.936073	2026-01-24 14:45:42.936071
49	8	30	\N	2026-01-24 14:45:42.962995	2026-01-24 14:45:42.962992
49	9	34	\N	2026-01-24 14:45:43.03526	2026-01-24 14:45:43.035257
49	10	40	\N	2026-01-24 14:45:43.044058	2026-01-24 14:45:43.044056
49	11	47	\N	2026-01-24 14:45:43.130582	2026-01-24 14:45:43.13058
49	12	52	\N	2026-01-24 14:45:43.15415	2026-01-24 14:45:43.154148
49	15	55	\N	2026-01-24 14:45:43.288305	2026-01-24 14:45:43.288303
49	6	\N	4	2026-01-24 14:45:43.317201	2026-01-24 14:45:43.317199
49	4	17	\N	2026-01-24 14:45:43.385765	2026-01-24 14:45:43.385763
49	13	\N	3	2026-01-24 14:45:43.446343	2026-01-24 14:45:43.446341
49	17	\N	40	2026-01-24 14:45:43.455299	2026-01-24 14:45:43.455296
49	5	20	\N	2026-01-24 14:45:44.265194	2026-01-24 14:45:44.265192
49	3	11	\N	2026-01-24 14:45:44.375795	2026-01-24 14:45:44.375792
\.


--
-- TOC entry 3862 (class 0 OID 17161)
-- Dependencies: 274
-- Data for Name: PetEvent; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PetEvent" ("EventId", "Title", "Description", "CoverImageUrl", "StartTime", "SubmissionDeadline", "EndTime", "Status", "PrizeDescription", "PrizePoints", "CreatedBy", "CreatedAt", "UpdatedAt") FROM stdin;
2	Mèo ngủ xấu nhất !!!	Hãy gửi ảnh bé cưng của mình ngủ xấu nhất na !!!	https://i.pinimg.com/736x/51/56/6b/51566bee5e751cfdf8a818afb6a8ce97.jpg	2026-01-10 00:18:00	2026-01-10 00:25:00	2026-01-10 00:26:00	completed	Vinh Danh	0	1	2026-01-10 00:17:01.99608	2026-01-10 00:26:39.362184
3	Mèo ngủ xấu nhất kkkk	Gửi ảnh bé mèo của bạn ngủ xấu nhất cho chúng tôi	https://i.pinimg.com/736x/51/56/6b/51566bee5e751cfdf8a818afb6a8ce97.jpg	2026-01-10 14:17:00	2026-01-10 14:19:00	2026-01-10 14:20:00	completed	Được vip 1 tháng	0	1	2026-01-10 14:16:18.6781	2026-01-10 14:20:13.548271
4	Bé mèo cute nhất !	Hãy gửi hình ảnh bé mèo của bạn ăn uống và giành giải bé mèo đẹp nhất. !	https://cityzoo.vn/img_data/images/sai-lam-cho-meo-an.jpg	2026-01-11 19:58:00	2026-01-11 20:00:00	2026-01-11 20:01:00	completed	Vip 1 tháng	0	1	2026-01-11 19:57:44.594951	2026-01-11 20:01:11.157204
29	Mèo ngủ xấu nhất	GỬi ảnh	https://res.cloudinary.com/darsvolyp/image/upload/v1769240370/pawnder/pets/1/bx2umpv4qak33ufwrkp3.jpg	2026-01-24 14:40:00	2026-01-24 14:41:00	2026-01-24 14:42:00	completed	\N	0	1	2026-01-24 14:39:45.913516	2026-01-24 14:42:08.397432
5	Mèo ngủ xấu nhất !!	Mèo ngủ xấu nhất gửi ảnh vào đây	https://i.pinimg.com/736x/51/56/6b/51566bee5e751cfdf8a818afb6a8ce97.jpg	2026-01-11 21:23:00	2026-01-12 21:25:00	2026-01-12 21:26:00	completed	Vip 1 tháng	0	1	2026-01-11 21:22:28.144093	2026-01-23 14:47:37.936129
\.


--
-- TOC entry 3825 (class 0 OID 16560)
-- Dependencies: 237
-- Data for Name: PetPhoto; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PetPhoto" ("PhotoId", "PetId", "ImageUrl", "PublicId", "IsPrimary", "SortOrder", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
6	10	https://res.cloudinary.com/darsvolyp/image/upload/v1768314623/pawnder/pets/10/wzuxt9dbajfmhhxutn9j.jpg	pawnder/pets/10/wzuxt9dbajfmhhxutn9j	t	1	f	2026-01-13 21:30:16.832402	2026-01-13 21:40:10.947018
7	10	https://res.cloudinary.com/darsvolyp/image/upload/v1768314625/pawnder/pets/10/fgxxzftqctqoybvawip4.jpg	pawnder/pets/10/fgxxzftqctqoybvawip4	f	0	f	2026-01-13 21:30:18.267263	2026-01-13 21:40:10.947019
29	19	https://picsum.photos/seed/max1/300/300	\N	t	0	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
30	19	https://picsum.photos/seed/max2/300/300	\N	f	1	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
36	22	https://picsum.photos/seed/kitty1/300/300	\N	t	0	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
37	22	https://picsum.photos/seed/kitty2/300/300	\N	f	1	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
38	22	https://picsum.photos/seed/kitty3/300/300	\N	f	2	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
39	23	https://picsum.photos/seed/buddy1/300/300	\N	t	0	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
40	23	https://picsum.photos/seed/buddy2/300/300	\N	f	1	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
41	24	https://picsum.photos/seed/mimi1/300/300	\N	t	0	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
42	24	https://picsum.photos/seed/mimi2/300/300	\N	f	1	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
43	24	https://picsum.photos/seed/mimi3/300/300	\N	f	2	f	2026-01-20 08:16:59.332574	2026-01-20 08:16:59.332574
46	25	https://res.cloudinary.com/darsvolyp/image/upload/v1768898172/pawnder/pets/25/ucbeqk9gkjvs9rtexokw.jpg	pawnder/pets/25/ucbeqk9gkjvs9rtexokw	t	0	f	2026-01-20 15:36:05.539727	2026-01-20 15:36:05.539728
44	2	https://res.cloudinary.com/darsvolyp/image/upload/v1768897683/pawnder/pets/2/q44x4tllnwhkilgctliw.jpg	pawnder/pets/2/q44x4tllnwhkilgctliw	t	0	f	2026-01-20 15:27:56.470086	2026-01-20 15:28:00.183373
3	2	https://picsum.photos/seed/102/300/300	\N	f	1	t	2026-01-05 13:46:27.838373	2026-01-20 15:28:01.941694
28	18	https://picsum.photos/seed/bella3/300/300	\N	f	2	t	2026-01-20 08:16:59.332574	2026-01-20 15:30:06.929578
27	18	https://picsum.photos/seed/bella2/300/300	\N	f	1	t	2026-01-20 08:16:59.332574	2026-01-20 15:30:09.122836
47	25	https://res.cloudinary.com/darsvolyp/image/upload/v1768898173/pawnder/pets/25/bh6cxv91maaiwzb4wxpe.jpg	pawnder/pets/25/bh6cxv91maaiwzb4wxpe	f	1	f	2026-01-20 15:36:06.53359	2026-01-20 15:36:06.533591
48	26	https://res.cloudinary.com/darsvolyp/image/upload/v1768898467/pawnder/pets/26/xx1v1rbsezjyyaotkh3u.jpg	pawnder/pets/26/xx1v1rbsezjyyaotkh3u	t	0	f	2026-01-20 15:40:59.993033	2026-01-20 15:40:59.993033
26	18	https://picsum.photos/seed/bella1/300/300	\N	f	1	t	2026-01-20 08:16:59.332574	2026-01-20 15:30:24.119541
45	18	https://res.cloudinary.com/darsvolyp/image/upload/v1768897826/pawnder/pets/18/a26iev8arvljipx4dpy4.jpg	pawnder/pets/18/a26iev8arvljipx4dpy4	t	0	f	2026-01-20 15:30:18.907097	2026-01-20 15:30:24.255859
49	26	https://res.cloudinary.com/darsvolyp/image/upload/v1768898468/pawnder/pets/26/fm69pd5hamnlztfgenx6.jpg	pawnder/pets/26/fm69pd5hamnlztfgenx6	f	1	f	2026-01-20 15:41:00.976137	2026-01-20 15:41:00.976138
50	27	https://res.cloudinary.com/darsvolyp/image/upload/v1768898555/pawnder/pets/27/c9ccfyn0hotl33yzq7sn.jpg	pawnder/pets/27/c9ccfyn0hotl33yzq7sn	t	0	f	2026-01-20 15:42:28.162384	2026-01-20 15:42:28.162385
51	27	https://res.cloudinary.com/darsvolyp/image/upload/v1768898556/pawnder/pets/27/fx7dhu97jwg0g4w439zj.jpg	pawnder/pets/27/fx7dhu97jwg0g4w439zj	f	1	f	2026-01-20 15:42:29.53549	2026-01-20 15:42:29.535491
33	20	https://picsum.photos/seed/coco3/300/300	\N	f	2	t	2026-01-20 08:16:59.332574	2026-01-20 15:47:43.089799
32	20	https://picsum.photos/seed/coco2/300/300	\N	f	1	t	2026-01-20 08:16:59.332574	2026-01-20 15:47:45.439411
53	20	https://res.cloudinary.com/darsvolyp/image/upload/v1768898881/pawnder/pets/20/uxytuyevrvpbnb8drqqw.jpg	pawnder/pets/20/uxytuyevrvpbnb8drqqw	f	2	f	2026-01-20 15:47:53.926558	2026-01-20 15:47:53.926558
31	20	https://picsum.photos/seed/coco1/300/300	\N	f	0	t	2026-01-20 08:16:59.332574	2026-01-20 15:48:13.050815
52	20	https://res.cloudinary.com/darsvolyp/image/upload/v1768898879/pawnder/pets/20/e6pgjr9soci9cguvf289.jpg	pawnder/pets/20/e6pgjr9soci9cguvf289	t	1	f	2026-01-20 15:47:52.8385	2026-01-20 15:48:13.165381
34	21	https://picsum.photos/seed/rocky1/300/300	\N	f	0	t	2026-01-20 08:16:59.332574	2026-01-20 15:51:12.071965
35	21	https://picsum.photos/seed/rocky2/300/300	\N	t	1	f	2026-01-20 08:16:59.332574	2026-01-20 15:51:12.182866
56	30	https://res.cloudinary.com/darsvolyp/image/upload/v1768899442/pawnder/pets/30/s7rfilajsnenotpjl7ah.jpg	pawnder/pets/30/s7rfilajsnenotpjl7ah	t	0	f	2026-01-20 15:57:15.218308	2026-01-20 15:57:15.218309
57	30	https://res.cloudinary.com/darsvolyp/image/upload/v1768899443/pawnder/pets/30/s0jlrxlo7qrgnr7w2j7u.jpg	pawnder/pets/30/s0jlrxlo7qrgnr7w2j7u	f	1	f	2026-01-20 15:57:16.409924	2026-01-20 15:57:16.409925
58	31	https://res.cloudinary.com/darsvolyp/image/upload/v1768899642/pawnder/pets/31/mlczosthbdtbdvgknms3.jpg	pawnder/pets/31/mlczosthbdtbdvgknms3	t	0	f	2026-01-20 16:00:35.800143	2026-01-20 16:00:35.800143
59	31	https://res.cloudinary.com/darsvolyp/image/upload/v1768899644/pawnder/pets/31/g7y4ogkkb3gakjmpamnk.jpg	pawnder/pets/31/g7y4ogkkb3gakjmpamnk	f	1	f	2026-01-20 16:00:36.89484	2026-01-20 16:00:36.894841
60	32	https://res.cloudinary.com/darsvolyp/image/upload/v1768899788/pawnder/pets/32/z7497twdbbnjh5j0ktj8.jpg	pawnder/pets/32/z7497twdbbnjh5j0ktj8	t	0	f	2026-01-20 16:03:01.326975	2026-01-20 16:03:01.326976
61	32	https://res.cloudinary.com/darsvolyp/image/upload/v1768899789/pawnder/pets/32/izdbc9dm2gmbc2gvbyfd.jpg	pawnder/pets/32/izdbc9dm2gmbc2gvbyfd	f	1	f	2026-01-20 16:03:02.70713	2026-01-20 16:03:02.70713
62	2	https://res.cloudinary.com/darsvolyp/image/upload/v1769181390/pawnder/pets/2/loyqyssn92bspohw6ocz.jpg	pawnder/pets/2/loyqyssn92bspohw6ocz	f	1	f	2026-01-23 22:16:31.596611	2026-01-23 22:16:31.596634
63	2	https://res.cloudinary.com/darsvolyp/image/upload/v1769181401/pawnder/pets/2/hrxuowp12eewp8x5qw7o.jpg	pawnder/pets/2/hrxuowp12eewp8x5qw7o	f	2	f	2026-01-23 22:16:43.193938	2026-01-23 22:16:43.193941
64	2	https://res.cloudinary.com/darsvolyp/image/upload/v1769181410/pawnder/pets/2/k84nh3o5vymh1g4pvsao.jpg	pawnder/pets/2/k84nh3o5vymh1g4pvsao	f	3	t	2026-01-23 22:16:51.270641	2026-01-23 22:16:56.230254
65	35	https://res.cloudinary.com/darsvolyp/image/upload/v1769181865/pawnder/pets/35/nh2hwfakxfvrrw4rupmd.jpg	pawnder/pets/35/nh2hwfakxfvrrw4rupmd	t	0	f	2026-01-23 22:24:26.314793	2026-01-23 22:24:26.31481
66	35	https://res.cloudinary.com/darsvolyp/image/upload/v1769181866/pawnder/pets/35/voftextonrkfzsgnta90.jpg	pawnder/pets/35/voftextonrkfzsgnta90	f	1	f	2026-01-23 22:24:27.565313	2026-01-23 22:24:27.565316
67	36	https://res.cloudinary.com/darsvolyp/image/upload/v1769184011/pawnder/pets/36/hiwra720q5ke8ks8nsqe.jpg	pawnder/pets/36/hiwra720q5ke8ks8nsqe	t	0	f	2026-01-23 23:00:12.932174	2026-01-23 23:00:12.932205
68	36	https://res.cloudinary.com/darsvolyp/image/upload/v1769184014/pawnder/pets/36/jyee0gpkjfut4ergzy2s.jpg	pawnder/pets/36/jyee0gpkjfut4ergzy2s	f	1	f	2026-01-23 23:00:15.784115	2026-01-23 23:00:15.784118
2	1	https://picsum.photos/seed/101/300/300	\N	f	0	t	2026-01-05 13:46:27.838373	2026-01-24 01:53:42.828953
1	1	https://picsum.photos/seed/100/300/300	\N	f	0	t	2026-01-05 13:46:27.838373	2026-01-24 01:53:57.332343
81	42	https://res.cloudinary.com/darsvolyp/image/upload/v1769192078/pawnder/pets/42/onfnw11k0lx0unbgmn3x.jpg	pawnder/pets/42/onfnw11k0lx0unbgmn3x	t	1	f	2026-01-24 01:14:39.44516	2026-01-24 01:15:42.77481
82	42	https://res.cloudinary.com/darsvolyp/image/upload/v1769192079/pawnder/pets/42/blrj12xg5k8uirt5ppe1.jpg	pawnder/pets/42/blrj12xg5k8uirt5ppe1	f	0	f	2026-01-24 01:14:40.415242	2026-01-24 01:15:42.774813
83	43	https://res.cloudinary.com/darsvolyp/image/upload/v1769192265/pawnder/pets/43/ezaewlm9achvsgq54zfr.jpg	pawnder/pets/43/ezaewlm9achvsgq54zfr	t	0	f	2026-01-24 01:17:46.151056	2026-01-24 01:17:46.151058
84	43	https://res.cloudinary.com/darsvolyp/image/upload/v1769192266/pawnder/pets/43/dai8xqdavybqhgzsvtqa.jpg	pawnder/pets/43/dai8xqdavybqhgzsvtqa	f	1	f	2026-01-24 01:17:46.793005	2026-01-24 01:17:46.793008
85	44	https://res.cloudinary.com/darsvolyp/image/upload/v1769192441/pawnder/pets/44/gbphd8dnt5vlhrxxw2za.jpg	pawnder/pets/44/gbphd8dnt5vlhrxxw2za	t	0	f	2026-01-24 01:20:41.539034	2026-01-24 01:20:41.539037
86	44	https://res.cloudinary.com/darsvolyp/image/upload/v1769192441/pawnder/pets/44/dhfhu64gnpecmwog1xg1.jpg	pawnder/pets/44/dhfhu64gnpecmwog1xg1	f	1	f	2026-01-24 01:20:42.406099	2026-01-24 01:20:42.406102
87	45	https://res.cloudinary.com/darsvolyp/image/upload/v1769192527/pawnder/pets/45/ut3lbeqv3oylml38y0hd.jpg	pawnder/pets/45/ut3lbeqv3oylml38y0hd	t	0	f	2026-01-24 01:22:08.31499	2026-01-24 01:22:08.314992
88	45	https://res.cloudinary.com/darsvolyp/image/upload/v1769192528/pawnder/pets/45/e9aso10plzdbz8nfqjdy.jpg	pawnder/pets/45/e9aso10plzdbz8nfqjdy	f	1	f	2026-01-24 01:22:09.693691	2026-01-24 01:22:09.693694
89	46	https://res.cloudinary.com/darsvolyp/image/upload/v1769192647/pawnder/pets/46/txo68dqaqq87jnmlksl9.jpg	pawnder/pets/46/txo68dqaqq87jnmlksl9	t	0	f	2026-01-24 01:24:07.928288	2026-01-24 01:24:07.928291
90	46	https://res.cloudinary.com/darsvolyp/image/upload/v1769192648/pawnder/pets/46/tld0e2l8mtg4tdnaaiqd.jpg	pawnder/pets/46/tld0e2l8mtg4tdnaaiqd	f	1	f	2026-01-24 01:24:08.53914	2026-01-24 01:24:08.539142
91	46	https://res.cloudinary.com/darsvolyp/image/upload/v1769192648/pawnder/pets/46/xaptim7iofpvdfmbqrwe.jpg	pawnder/pets/46/xaptim7iofpvdfmbqrwe	f	2	f	2026-01-24 01:24:09.440935	2026-01-24 01:24:09.440937
92	47	https://res.cloudinary.com/darsvolyp/image/upload/v1769193977/pawnder/pets/47/eealdthxuc0k0fydjrtm.jpg	pawnder/pets/47/eealdthxuc0k0fydjrtm	t	1	f	2026-01-24 01:46:18.343031	2026-01-24 01:49:01.7433
93	47	https://res.cloudinary.com/darsvolyp/image/upload/v1769193978/pawnder/pets/47/as0fs3ou8qigfkrmyitv.jpg	pawnder/pets/47/as0fs3ou8qigfkrmyitv	f	0	f	2026-01-24 01:46:19.182413	2026-01-24 01:49:01.743303
94	1	https://res.cloudinary.com/darsvolyp/image/upload/v1769194432/pawnder/pets/1/b4lpsajifto6c8qrhruf.jpg	pawnder/pets/1/b4lpsajifto6c8qrhruf	t	1	f	2026-01-24 01:53:52.579512	2026-01-24 01:54:00.94011
95	1	https://res.cloudinary.com/darsvolyp/image/upload/v1769194432/pawnder/pets/1/u7a6bhcdyrycnjaxguwq.jpg	pawnder/pets/1/u7a6bhcdyrycnjaxguwq	f	0	f	2026-01-24 01:53:53.547336	2026-01-24 01:54:00.940112
96	49	https://res.cloudinary.com/darsvolyp/image/upload/v1769240687/pawnder/pets/49/rwzsivt3mtthsw0fxbky.jpg	pawnder/pets/49/rwzsivt3mtthsw0fxbky	t	0	f	2026-01-24 14:44:47.633998	2026-01-24 14:44:47.634
97	49	https://res.cloudinary.com/darsvolyp/image/upload/v1769240687/pawnder/pets/49/djgubhc1twcocfynyokn.jpg	pawnder/pets/49/djgubhc1twcocfynyokn	f	1	f	2026-01-24 14:44:48.287991	2026-01-24 14:44:48.287993
\.


--
-- TOC entry 3852 (class 0 OID 16885)
-- Dependencies: 264
-- Data for Name: Policy; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Policy" ("PolicyId", "PolicyCode", "PolicyName", "Description", "DisplayOrder", "RequireConsent", "IsActive", "IsDeleted", "CreatedAt", "UpdatedAt") FROM stdin;
2	PRIVACY_POLICY	Chính sách quyền riêng tư	Quy định việc thu thập, sử dụng và bảo vệ dữ liệu người dùng.	2	t	t	f	2026-01-07 03:29:55.843758	2026-01-24 14:42:29.31305
5	CONTENT_POLICY	Chính sách nội dung & hành vi cộng đồng	Quy định về nội dung và hành vi của người dùng trên hệ thống.	4	t	t	f	2026-01-21 15:10:33.112238	2026-01-24 14:42:30.145995
4	MEETING_DISCLAIMER	Điều khoản hẹn gặp & miễn trừ trách nhiệm	Quy định trách nhiệm của người dùng khi hẹn gặp ngoài đời và miễn trừ trách nhiệm pháp lý cho nền tảng.	3	t	t	f	2026-01-21 15:04:17.166638	2026-01-24 14:42:27.032397
1	TERMS_OF_SERVICE	Điều khoản sử dụng	Quy định quyền và nghĩa vụ của người dùng khi sử dụng ứng dụng Pawnder.	1	t	t	f	2026-01-07 03:29:55.843758	2026-01-24 14:42:28.358346
\.


--
-- TOC entry 3854 (class 0 OID 16907)
-- Dependencies: 266
-- Data for Name: PolicyVersion; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."PolicyVersion" ("PolicyVersionId", "PolicyId", "VersionNumber", "Title", "Content", "ChangeLog", "Status", "PublishedAt", "DeactivatedAt", "CreatedByUserId", "CreatedAt", "UpdatedAt") FROM stdin;
2	2	1	Chính sách quyền riêng tư Pawnder v1.0	\n# CHÍNH SÁCH QUYỀN RIÊNG TƯ (PRIVACY POLICY)\n\n**Phiên bản:** 1.0  \n**Ngày hiệu lực:** Theo ngày phát hành\n\n## 1. Nguyên tắc bảo vệ dữ liệu\n\nPawnder cam kết bảo vệ dữ liệu cá nhân của người dùng theo đúng quy định pháp luật hiện hành và áp dụng các biện pháp kỹ thuật, tổ chức phù hợp nhằm đảm bảo an toàn thông tin.\n\n## 2. Thông tin thu thập\n\nChúng tôi có thể thu thập các loại thông tin sau:\n\n- **Thông tin định danh:** họ tên, email, số điện thoại\n- **Thông tin tài khoản và xác thực**\n- **Nội dung người dùng cung cấp:** hình ảnh, mô tả, dữ liệu thú cưng\n- **Dữ liệu kỹ thuật:** IP, log truy cập, thiết bị, hành vi sử dụng\n\n## 3. Mục đích sử dụng dữ liệu\n\nDữ liệu cá nhân được sử dụng để:\n\n- Cung cấp và duy trì dịch vụ\n- Xác thực danh tính và bảo mật tài khoản\n- Cải thiện chất lượng sản phẩm\n- Phòng chống gian lận và hành vi vi phạm\n- Tuân thủ nghĩa vụ pháp lý\n\n## 4. Lưu trữ và bảo mật dữ liệu\n\nDữ liệu được lưu trữ trong thời gian cần thiết cho mục đích sử dụng.\n\nÁp dụng các biện pháp:\n\n- Mã hóa\n- Phân quyền truy cập\n- Giám sát và ghi log\n\nPawnder không đảm bảo an toàn tuyệt đối nhưng cam kết nỗ lực tối đa để bảo vệ dữ liệu.\n\n## 5. Chia sẻ dữ liệu\n\nDữ liệu cá nhân không được chia sẻ cho bên thứ ba, trừ các trường hợp:\n\n- Có sự đồng ý rõ ràng của người dùng\n- Theo yêu cầu của cơ quan nhà nước có thẩm quyền\n- Phục vụ mục đích bảo mật, phòng chống gian lận\n- Đối tác kỹ thuật cần thiết để vận hành hệ thống\n\n## 6. Quyền của người dùng\n\nNgười dùng có quyền:\n\n- Yêu cầu truy cập, chỉnh sửa dữ liệu cá nhân\n- Yêu cầu xóa tài khoản và dữ liệu liên quan\n- Rút lại sự đồng ý (điều này có thể làm gián đoạn dịch vụ)\n\nYêu cầu sẽ được xử lý trong thời hạn hợp lý theo quy định pháp luật.\n\n## 7. Thay đổi chính sách quyền riêng tư\n\nChính sách này có thể được cập nhật theo thời gian.\n\n- Mọi thay đổi quan trọng sẽ yêu cầu người dùng xác nhận lại\n- Không xác nhận → tạm ngưng quyền sử dụng dịch vụ\n\n## 8. Hiệu lực\n\nChính sách quyền riêng tư có hiệu lực kể từ thời điểm được phát hành và thay thế cho các phiên bản trước đó.\n	Phiên bản đầu tiên	DRAFT	2026-01-08 14:26:05.452052	2026-01-23 13:53:54.190542	\N	2026-01-07 03:29:55.843758	2026-01-23 13:53:54.190554
6	4	1	Điều khoản hẹn gặp & miễn trừ trách nhiệm v1.0	Pawnder là nền tảng trung gian giúp người dùng kết nối, trao đổi thông tin và sắp xếp các hoạt động liên quan đến thú cưng. Pawnder không tổ chức, không giám sát, không xác nhận và không chịu trách nhiệm đối với bất kỳ cuộc gặp gỡ ngoài đời thực nào giữa người dùng.\n\nViệc hẹn gặp ngoài đời thực chỉ được thực hiện khi các bên đã tự nguyện kết nối và trao đổi thông tin với nhau thông qua ứng dụng. Mọi thỏa thuận, hành vi, quyết định hoặc phát sinh sau khi kết nối, bao gồm nhưng không giới hạn ở việc gặp mặt ngoài đời, đều do người dùng tự chịu hoàn toàn trách nhiệm.\n\nPawnder không chịu trách nhiệm pháp lý đối với bất kỳ tranh chấp, thiệt hại, tổn thất về tài sản, sức khỏe, hành vi vi phạm pháp luật hoặc hậu quả nào phát sinh giữa người dùng với nhau, kể cả khi các bên đã kết nối thông qua ứng dụng.\n\nTrong trường hợp có yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền, Pawnder sẽ phối hợp và cung cấp thông tin theo đúng quy định của pháp luật hiện hành.	Tạo mới điều khoản hẹn gặp và miễn trừ trách nhiệm cho người dùng.	ACTIVE	2026-01-24 14:42:04.457614	\N	1	2026-01-21 15:05:29.376492	2026-01-24 14:42:04.458291
1	1	1	Điều khoản sử dụng Pawnder v1.0	\n# ĐIỀU KHOẢN SỬ DỤNG (TERMS OF SERVICE)\n\n**Phiên bản:** 1.0  \n**Ngày hiệu lực:** Theo ngày phát hành  \n**Áp dụng cho:** Toàn bộ người dùng ứng dụng\n\n## 1. Chấp nhận điều khoản\n\nBằng việc đăng ký tài khoản, đăng nhập hoặc sử dụng ứng dụng Pawnder, người dùng xác nhận rằng đã đọc, hiểu và đồng ý với toàn bộ Điều khoản sử dụng này.\n\nTrong trường hợp người dùng không đồng ý với bất kỳ nội dung nào, người dùng phải chấm dứt ngay việc sử dụng ứng dụng.\n\nViệc tiếp tục sử dụng ứng dụng được xem là sự chấp thuận ràng buộc pháp lý đối với Điều khoản này.\n\n## 2. Điều kiện sử dụng dịch vụ\n\nNgười dùng phải đủ 18 tuổi trở lên hoặc đủ năng lực hành vi dân sự theo quy định pháp luật.\n\nNgười dùng cam kết:\n\n- Cung cấp thông tin chính xác, trung thực, đầy đủ\n- Chịu trách nhiệm về mọi hoạt động phát sinh từ tài khoản\n\nPawnder có quyền từ chối cung cấp dịch vụ nếu phát hiện thông tin không chính xác hoặc có dấu hiệu gian lận.\n\n## 3. Tài khoản người dùng\n\nMỗi người dùng chỉ được đăng ký 01 tài khoản.\n\nNgười dùng chịu trách nhiệm bảo mật:\n\n- Tên đăng nhập\n- Mật khẩu\n- Mã xác thực (nếu có)\n\nPawnder không chịu trách nhiệm đối với thiệt hại phát sinh do người dùng làm lộ thông tin tài khoản.\n\n## 4. Hành vi bị nghiêm cấm\n\nNgười dùng không được phép:\n\n- Sử dụng ứng dụng cho mục đích trái pháp luật\n- Đăng tải hoặc chia sẻ nội dung:\n  - Vi phạm pháp luật\n  - Khiêu dâm, phản cảm, bạo lực\n  - Xúc phạm, quấy rối, phân biệt đối xử\n- Giả mạo danh tính hoặc thông tin\n- Can thiệp, phá hoại, khai thác trái phép hệ thống\n- Thu thập dữ liệu người dùng khác khi chưa được cho phép\n\nMọi hành vi vi phạm có thể dẫn đến khóa tài khoản ngay lập tức mà không cần thông báo trước.\n\n## 5. Quyền của Pawnder\n\nPawnder có toàn quyền:\n\n- Chỉnh sửa, tạm ngưng hoặc chấm dứt dịch vụ\n- Gỡ bỏ hoặc hạn chế nội dung vi phạm\n- Khóa tạm thời hoặc vĩnh viễn tài khoản người dùng\n- Áp dụng các biện pháp kỹ thuật để bảo vệ hệ thống\n\nQuyết định của Pawnder trong các trường hợp này là cuối cùng.\n\n## 6. Giới hạn trách nhiệm\n\nPawnder không chịu trách nhiệm đối với:\n\n- Thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả\n- Gián đoạn dịch vụ do sự cố kỹ thuật, bảo trì, hoặc yếu tố bất khả kháng\n- Hành vi hoặc nội dung do người dùng tạo ra\n\nTrong mọi trường hợp, trách nhiệm (nếu có) của Pawnder không vượt quá chi phí người dùng đã thanh toán cho dịch vụ (nếu có).\n\n## 7. Thay đổi điều khoản\n\nPawnder có quyền sửa đổi Điều khoản sử dụng bất kỳ lúc nào.\n\n- Phiên bản mới sẽ được công bố chính thức\n- Người dùng bắt buộc xác nhận lại\n- Không xác nhận → không được tiếp tục sử dụng ứng dụng\n\n## 8. Luật áp dụng và giải quyết tranh chấp\n\nĐiều khoản này được điều chỉnh theo pháp luật Việt Nam.\n\nMọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng. Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra Tòa án có thẩm quyền tại Việt Nam.\n	Phiên bản đầu tiên	DRAFT	2026-01-14 20:32:21.490215	2026-01-23 13:53:53.985552	\N	2026-01-07 03:29:55.843758	2026-01-23 13:53:53.986462
7	1	2	Điều khoản sử dụng v1.0	Pawnder là nền tảng cung cấp các tính năng kết nối người dùng có thú cưng, bao gồm tạo hồ sơ thú cưng, tham gia ghép đôi, trò chuyện, sự kiện và các dịch vụ hỗ trợ khác. Khi sử dụng ứng dụng, người dùng đồng ý tuân thủ các điều khoản và quy định do Pawnder ban hành.\n\nNgười dùng cam kết cung cấp thông tin chính xác, không sử dụng ứng dụng cho mục đích trái pháp luật, gian lận hoặc gây ảnh hưởng tiêu cực đến người dùng khác và hệ thống.\n\nPawnder có quyền tạm ngưng hoặc chấm dứt quyền sử dụng ứng dụng đối với các tài khoản vi phạm điều khoản sử dụng mà không cần báo trước.	Tạo mới điều khoản sử dụng.	ACTIVE	2026-01-24 14:42:39.006443	\N	1	2026-01-21 15:08:47.968635	2026-01-24 14:42:39.006471
8	2	2	Chính sách quyền riêng tư v1.0	Pawnder thu thập các thông tin cần thiết nhằm cung cấp và cải thiện dịch vụ, bao gồm thông tin tài khoản, hồ sơ thú cưng, nội dung trò chuyện, hình ảnh, video và dữ liệu liên quan đến việc sử dụng ứng dụng.\n\nMọi dữ liệu người dùng được lưu trữ và bảo mật theo các biện pháp kỹ thuật phù hợp. Pawnder không chia sẻ thông tin cá nhân của người dùng cho bên thứ ba, trừ trường hợp có sự đồng ý của người dùng hoặc theo yêu cầu hợp pháp từ cơ quan nhà nước có thẩm quyền.	Tạo mới chính sách quyền riêng tư.	ACTIVE	2026-01-24 14:42:39.132015	\N	1	2026-01-21 15:09:40.784678	2026-01-24 14:42:39.132019
9	5	1	Điều khoản v1.0	Người dùng chịu trách nhiệm đối với mọi nội dung đăng tải lên hệ thống, bao gồm hình ảnh, video, bình luận và tin nhắn. Nghiêm cấm đăng tải nội dung phản cảm, bạo lực, gian lận, xúc phạm hoặc vi phạm pháp luật.\n\nPawnder có quyền kiểm duyệt, xóa nội dung hoặc áp dụng các biện pháp xử lý đối với tài khoản vi phạm mà không cần báo trước.		ACTIVE	2026-01-24 14:42:39.248666	\N	1	2026-01-21 15:10:58.13434	2026-01-24 14:42:39.24867
\.


--
-- TOC entry 3837 (class 0 OID 16726)
-- Dependencies: 249
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Report" ("ReportId", "UserReportId", "ContentId", "Reason", "Status", "Resolution", "CreatedAt", "UpdatedAt") FROM stdin;
1	3	1	[ReportedUser=Lê Minh D] Người dùng bên kia gửi tin nhắn lặp lại gây phiền.	Pending	\N	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	4	2	[ReportedUser=Lê Minh C] Nội dung bị phản hồi không đúng chủ đề, đề nghị admin kiểm tra.	Resolved	Admin đã nhắc nhở user1 và khóa chat 24h.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	3	2	[ReportedUser=Lê Minh D] Báo cáo nhầm, không có bằng chứng vi phạm.	Rejected	Không phát hiện vi phạm, báo cáo bị từ chối.	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
4	4	1	[ReportedUser=Lê Minh C] Người dùng này gửi tin nhắn có nội dung không phù hợp với mục đích của ứng dụng.	Pending	\N	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
5	3	2	[ReportedUser=Lê Minh D] Người dùng này có hành vi quấy rối, gửi tin nhắn liên tục và không tôn trọng người khác.	Pending	\N	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
\.


--
-- TOC entry 3808 (class 0 OID 16397)
-- Dependencies: 220
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."Role" ("RoleId", "RoleName", "CreatedAt", "UpdatedAt") FROM stdin;
1	Admin	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	Expert	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	User	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
\.


--
-- TOC entry 3814 (class 0 OID 16432)
-- Dependencies: 226
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."User" ("UserId", "RoleId", "UserStatusId", "AddressId", "FullName", "Gender", "Email", "PasswordHash", "ProviderLogin", "TokenJWT", "IsDeleted", "CreatedAt", "UpdatedAt", "IsProfileComplete") FROM stdin;
3	3	2	1	Lê Minh C	Nam	user@example.com	$2a$11$MeBy0YTqD4HZA4lVQZsbWOtzCAFCgCZtMlNvBkMXlB9a.5RdhUe/2	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwidG9rZW5fdHlwZSI6InJlZnJlc2giLCJqdGkiOiJhMzM5ZDAyYi01NzA0LTQxNzQtYWM4Ni1hOGVmZmY0ZThjNDIiLCJleHAiOjE3NzE1ODM0NTcsImlzcyI6Ik15QXBwIiwiYXVkIjoiTXlBcHBDbGllbnRzIn0.vd7NU1KBNsIhrT-l_Dxrw3L_ZXoHE6TUtUj-DYngnmA	f	2026-01-05 13:46:27.838373	2026-01-24 13:04:18.865306	t
18	3	2	16	Lê Thị Mai	Nữ	user7@pawnder.com	$2a$11$H9CzmTLDZ/2VkYdSFtnVN.5e7Qgp0XkbxLloeKTU9/Pg2Y6jkWQpa	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE4IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiYmI4Y2ZhMTktYWM4Ni00NGU5LWFlMmMtOTA1NmZjMzJkODYzIiwiZXhwIjoxNzcxNDkxMjY2LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.TWQ3pO6Hwdqa5q3Od_45HU5f05whvWpl0QaEWPOpskE	f	2026-01-20 08:16:38.538578	2026-01-24 02:00:08.638088	t
2	2	2	2	Trần Thị B	Nữ	expert@pawnder.com	$2a$11$azzNrVBUn1lPFCorw2es2ut9btU6sAgmnoVScmYgXL1crHJYr6etC	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJFeHBlcnQiLCJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImp0aSI6IjIxNTVjMjE3LTA2NjUtNDhmZS1iZDkxLThkNTc3ZTZhMzQ5ZiIsImV4cCI6MTc3MTA2NzMzMiwiaXNzIjoiTXlBcHAiLCJhdWQiOiJNeUFwcENsaWVudHMifQ.QDDVWMXlo5Po7_TLXztOvPPqYhm2gEGygzGO_0iQOe0	f	2026-01-05 13:46:27.838373	2026-01-24 14:39:10.757972	t
1	1	2	1	Nguyễn Văn A	Nam	admin@pawnder.com	$2a$11$MeBy0YTqD4HZA4lVQZsbWOtzCAFCgCZtMlNvBkMXlB9a.5RdhUe/2	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjEiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBZG1pbiIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiMTc5M2E2M2ItNTFlMS00N2Y2LTk0NTUtNmVkOGY1MzIwN2E1IiwiZXhwIjoxNzcwMjk3NDMwLCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.zsjswvTTe5kZ-UAJNjPhp7CDiF8ufzCcBVI9tIkZf9I	f	2026-01-05 13:46:27.838373	2026-01-24 13:17:35.888594	t
19	3	2	17	Vũ Văn Nam	Nam	user8@pawnder.com	$2a$11$6ruAX4fwbL8PYkw4QKnBfeLgw5DUQGo3.2pzbb.BJHElozYSDQwwy	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE5IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiZTNiMThkMmMtMTVjZS00ZjY2LTllZDAtNTFkNjc4MjVjNTI3IiwiZXhwIjoxNzcxNTgzNDU3LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.-sR2dhxyJ5YV8k6BbNu2SJ93IdeVwesfcvF76S4jl_o	f	2026-01-20 08:16:38.538578	2026-01-24 02:01:00.412066	t
20	3	2	18	Đỗ Thị Hà	Female	user9@pawnder.com	$2a$11$tvb1Ctx4297jKiCt.m./6u4pid5pEn2stmUxSd2sWQqRhPNjQ/yW6	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIwIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiZGE5ZmIxNzYtOWZkYS00Y2QwLTk4NGQtNWZiMmExOGM3MDNmIiwiZXhwIjoxNzcxNDkxNjgyLCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.fNOMMYpjVNyhIzPTvmawT4FdhHC98F4fRUQZCs2rqng	f	2026-01-20 08:16:38.538578	2026-01-24 02:02:11.637227	t
17	3	2	15	Hoàng Minh Tuấn	Male	user6@pawnder.com	$2a$11$b2WRoemdifZ3iWqwZ5YWZOtzN5GTpucS0ql7wXHGSsTGOct1W.uAW	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE3IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiMzBhMzdmNGMtMDc1Ni00MzNjLTk1N2YtNWZlY2ExNTZjZGVkIiwiZXhwIjoxNzcxNDkxMDQ2LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.sb9WXCCnytCG-vLY987udQmGSP4xwZp3lXs3gryrU9M	f	2026-01-20 08:16:38.538578	2026-01-24 01:59:14.651956	t
23	3	2	27	Trần Thị Linh	Nữ	user11@pawnder.com	$2a$11$.6IisFMYBJXZ4KQZecPjT.VfGQioKXG/i4eXZzARF24uf2vSpqu7.	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiYWE4ZmRkMjItN2EyMy00MzZjLWFkMWYtNWU0ZDIxYzdiNTY1IiwiZXhwIjoxNzcxNzg0MTczLCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.GjVAQwkdJKid9iFzZZ4PpnDB8wTntcq7wgrg9XPTcU4	f	2026-01-23 17:55:48.073102	2026-01-24 02:03:14.566036	t
4	3	2	1	Lê Minh D	Nam	user2@pawnder.com	$2a$11$nL4TaGoIMG4gQ9SgmYc8pOYCsvE37aAHQuNjDpAIS2iPwXCId2PS.	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjQiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwidG9rZW5fdHlwZSI6InJlZnJlc2giLCJqdGkiOiJkYzA3NTBkZi01YTExLTQxNzUtODFjOC0wN2MyMWQ2MTYwNGIiLCJleHAiOjE3NzE4MjYzMzAsImlzcyI6Ik15QXBwIiwiYXVkIjoiTXlBcHBDbGllbnRzIn0.8Y8bxnuxGFZR4IukZYG1eBqy2kQbBII4-ZY78TnZluU	f	2026-01-05 13:46:27.838373	2026-01-24 12:58:51.14277	t
16	3	2	14	Phạm Thị Lan	Female	user5@pawnder.com	$2a$11$Vmo6cUcNxSTlhAMM4wLsE.wimvgxs9PsPT5QlpGzSa8ub84DYTK8S	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE2IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiNTA4ZmJiNWItNmUxNi00ZDQ3LTliNGEtYjNjMTZmYWNkMjVkIiwiZXhwIjoxNzcxNDkwNzI4LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.SWeUPt-JrFenzo22SnZ1uAX1Fa2BzeQwpGlr-OTkC6s	f	2026-01-20 08:16:38.538578	2026-01-24 01:58:08.885459	t
15	3	2	13	Trần Văn Đức	Nam	user4@pawnder.com	$2a$11$/dQf92LGGHOiTyNGMwO4XulDmZOMmc75U1.bsCcJfyQbVeNY9FZbq	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE1IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiYzU4ODg1NzQtNmExZi00OGFmLWEzZTctZjI0ZTJlMTU3OGQ1IiwiZXhwIjoxNzcxNDg5ODg2LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.WrT4X2pLn2i10pXr5xXiTq4wcGwc0Lu2QQ0q6kNEsDQ	f	2026-01-20 08:16:38.538578	2026-01-24 02:15:07.3583	t
14	3	2	12	Nguyễn Thị Hương	Nữ	user3@pawnder.com	$2a$11$/q5HJDRxL4VFAiPYVDDXa.3hWpmy/Sybb57HQRNJT6VdCUgLJOpuG	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjE0IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiZDVmYTFlYmEtNWFmYi00ZjUzLTk0MjItNWExYjYxNDMyZjFkIiwiZXhwIjoxNzcxNzcxNDIxLCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.Swsc3VZJtBNFy1ogmG8w0TNkkadpQjYrZVDkIXwhsFc	f	2026-01-20 08:16:38.538578	2026-01-24 13:07:27.927889	t
22	3	2	26	Nguyễn Văn Hùng	Male	user10@pawnder.com	$2a$11$snOra6PjRBdUGohaUFHw3.HNmRvS/3/IehscxwYfbSijF6r5E8yEy	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIyIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiY2Y1MWFkOTEtNGYxYi00N2M5LTk1Y2QtYzZlMTEwNGNhMjE1IiwiZXhwIjoxNzcxNzgyOTk0LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.u-2HXKLlzJgdbyXAH80JR200ttGQSArPQ1uDoePPla4	f	2026-01-23 17:55:48.073102	2026-01-24 02:09:50.939458	t
24	3	2	28	Phạm Minh Tuấn	Nam	user12@pawnder.com	$2a$11$Zy2cKRNxbJPtbVJUQlKvfOKYUTnwJMN3pBwnN.qe4ld.F5ROB8Pwy	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjI0IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiMWIwOGQ4ZTUtNTY1Ny00YjUwLTgyODItMjdkYzAzYzdhMGMxIiwiZXhwIjoxNzcxNzg0MzQyLCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.wyAONKE2QfhdkUiZY__6R7cE0Gb8PaYVv_u9DcFFtFM	f	2026-01-23 17:55:48.073102	2026-01-24 01:21:17.775644	t
25	3	2	29	Lê Thị Hoa	Female	user13@pawnder.com	$2a$11$hQjvUEwmrELFC42igkzsrOb7qX3KPPo8ywrNmxmAFSVxOOKfWd6p.	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjI1IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiZTMyOTk3YjktYzkyZi00OGU4LThhZmYtYzExMGNjZWQyMzcwIiwiZXhwIjoxNzcxNzg0NDg2LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.juTWaoQcROX5Md1aObNrFPa84vKDZohz_wcu9g_9wXE	f	2026-01-23 17:55:48.073102	2026-01-24 02:03:43.079917	t
26	3	2	30	Hoàng Văn Nam	Male	user14@pawnder.com	$2a$11$Utt3UKmvs9sOSuAXfY.1z.4pJISCPl3RLE5lBP1QLaXUHKShSvFXm	local	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjI2IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsInRva2VuX3R5cGUiOiJyZWZyZXNoIiwianRpIjoiYWMxNzVmNDUtMTQ1Ny00ZWJkLTlhYWItYmVhMWMyMDFiZWE4IiwiZXhwIjoxNzcxNzg0NTU3LCJpc3MiOiJNeUFwcCIsImF1ZCI6Ik15QXBwQ2xpZW50cyJ9.9FC2WC8FnWwTBWmQ0KJen8e2fuUQXLvIL_I_nY6krSE	f	2026-01-23 17:55:48.073102	2026-01-24 02:05:59.939165	t
\.


--
-- TOC entry 3816 (class 0 OID 16466)
-- Dependencies: 228
-- Data for Name: UserBanHistory; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."UserBanHistory" ("BanId", "UserId", "BanStart", "BanEnd", "BanReason", "CreatedAt", "UpdatedAt", "IsActive") FROM stdin;
1	3	2026-01-17 21:28:16.214012	2026-01-17 21:28:36.646106	ddd	2026-01-17 21:28:16.214012	2026-01-17 21:28:36.646106	f
2	3	2026-01-18 01:53:29.940602	2026-01-18 02:03:14.389121	d	2026-01-18 01:53:29.940602	2026-01-18 02:03:14.389121	f
\.


--
-- TOC entry 3856 (class 0 OID 16939)
-- Dependencies: 268
-- Data for Name: UserPolicyAccept; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."UserPolicyAccept" ("AcceptId", "UserId", "PolicyVersionId", "AcceptedAt", "IsValid", "InvalidatedAt", "CreatedAt") FROM stdin;
16	4	1	2026-01-14 20:32:38.283041	f	2026-01-23 13:53:54.031066	2026-01-14 20:32:38.283005
17	3	1	2026-01-14 20:34:51.931769	f	2026-01-23 13:53:54.03111	2026-01-14 20:34:51.931768
20	14	1	2026-01-20 15:28:59.321613	f	2026-01-23 13:53:54.03111	2026-01-20 15:28:59.321612
23	15	1	2026-01-20 15:31:33.114419	f	2026-01-23 13:53:54.03111	2026-01-20 15:31:33.114418
26	16	1	2026-01-20 15:45:32.575132	f	2026-01-23 13:53:54.03111	2026-01-20 15:45:32.575131
29	17	1	2026-01-20 15:50:56.954837	f	2026-01-23 13:53:54.03111	2026-01-20 15:50:56.954836
32	18	1	2026-01-20 15:55:32.097219	f	2026-01-23 13:53:54.031111	2026-01-20 15:55:32.097219
35	19	1	2026-01-20 15:58:10.850989	f	2026-01-23 13:53:54.031111	2026-01-20 15:58:10.850988
38	20	1	2026-01-20 16:01:32.169554	f	2026-01-23 13:53:54.031111	2026-01-20 16:01:32.169554
12	4	2	2026-01-08 14:26:16.617943	f	2026-01-23 13:53:54.19977	2026-01-08 14:26:16.617941
13	3	2	2026-01-09 03:12:19.622559	f	2026-01-23 13:53:54.199771	2026-01-09 03:12:19.622396
18	14	2	2026-01-20 15:28:58.611255	f	2026-01-23 13:53:54.199772	2026-01-20 15:28:58.611215
21	15	2	2026-01-20 15:31:32.419704	f	2026-01-23 13:53:54.199772	2026-01-20 15:31:32.419702
24	16	2	2026-01-20 15:45:31.887984	f	2026-01-23 13:53:54.199772	2026-01-20 15:45:31.887983
27	17	2	2026-01-20 15:50:56.269532	f	2026-01-23 13:53:54.199772	2026-01-20 15:50:56.269531
30	18	2	2026-01-20 15:55:31.434645	f	2026-01-23 13:53:54.199772	2026-01-20 15:55:31.434644
33	19	2	2026-01-20 15:58:10.208709	f	2026-01-23 13:53:54.199772	2026-01-20 15:58:10.208709
36	20	2	2026-01-20 16:01:31.529753	f	2026-01-23 13:53:54.199772	2026-01-20 16:01:31.529752
39	4	7	2026-01-23 13:54:33.219536	t	\N	2026-01-23 13:54:33.219468
40	4	8	2026-01-23 13:54:33.26945	t	\N	2026-01-23 13:54:33.269448
41	4	6	2026-01-23 13:54:33.299546	t	\N	2026-01-23 13:54:33.299545
42	4	9	2026-01-23 13:54:33.325443	t	\N	2026-01-23 13:54:33.325442
43	15	7	2026-01-24 14:43:10.845246	t	\N	2026-01-24 14:43:10.845132
44	15	8	2026-01-24 14:43:10.887751	t	\N	2026-01-24 14:43:10.887749
45	15	6	2026-01-24 14:43:10.949451	t	\N	2026-01-24 14:43:10.949449
46	15	9	2026-01-24 14:43:10.993576	t	\N	2026-01-24 14:43:10.993573
\.


--
-- TOC entry 3821 (class 0 OID 16516)
-- Dependencies: 233
-- Data for Name: UserPreference; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."UserPreference" ("UserId", "AttributeId", "OptionId", "MaxValue", "MinValue", "CreatedAt", "UpdatedAt") FROM stdin;
4	16	\N	52	\N	2026-01-24 14:36:22.261914	2026-01-24 14:36:22.261914
20	16	\N	35	\N	2026-01-24 01:49:37.215222	2026-01-24 01:49:37.215222
3	16	\N	56	\N	2026-01-24 01:55:09.647836	2026-01-24 01:55:09.647836
26	16	\N	44	\N	2026-01-24 02:04:24.929809	2026-01-24 02:04:24.929809
22	16	\N	8	\N	2026-01-24 02:06:50.440333	2026-01-24 02:08:39.996285
25	16	\N	15	\N	2026-01-24 01:34:07.424887	2026-01-24 01:34:07.424887
\.


--
-- TOC entry 3810 (class 0 OID 16408)
-- Dependencies: 222
-- Data for Name: UserStatus; Type: TABLE DATA; Schema: public; Owner: pawnder_user
--

COPY public."UserStatus" ("UserStatusId", "UserStatusName", "CreatedAt", "UpdatedAt") FROM stdin;
1	Bị khóa	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
2	Tài khoản thường	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
3	Tài khoản VIP	2026-01-05 13:46:27.838373	2026-01-05 13:46:27.838373
\.


--
-- TOC entry 3917 (class 0 OID 0)
-- Dependencies: 223
-- Name: Address_AddressId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Address_AddressId_seq"', 30, true);


--
-- TOC entry 3918 (class 0 OID 0)
-- Dependencies: 231
-- Name: AttributeOption_OptionId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."AttributeOption_OptionId_seq"', 56, true);


--
-- TOC entry 3919 (class 0 OID 0)
-- Dependencies: 229
-- Name: Attribute_AttributeId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Attribute_AttributeId_seq"', 17, true);


--
-- TOC entry 3920 (class 0 OID 0)
-- Dependencies: 261
-- Name: BadWord_BadWordId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."BadWord_BadWordId_seq"', 11, true);


--
-- TOC entry 3921 (class 0 OID 0)
-- Dependencies: 241
-- Name: ChatAIContent_ContentId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatAIContent_ContentId_seq"', 15, true);


--
-- TOC entry 3922 (class 0 OID 0)
-- Dependencies: 239
-- Name: ChatAI_ChatAIId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatAI_ChatAIId_seq"', 6, true);


--
-- TOC entry 3923 (class 0 OID 0)
-- Dependencies: 259
-- Name: ChatExpertContent_ContentId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatExpertContent_ContentId_seq"', 7, true);


--
-- TOC entry 3924 (class 0 OID 0)
-- Dependencies: 257
-- Name: ChatExpert_ChatExpertId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatExpert_ChatExpertId_seq"', 3, true);


--
-- TOC entry 3925 (class 0 OID 0)
-- Dependencies: 246
-- Name: ChatUserContent_ContentId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatUserContent_ContentId_seq"', 83, true);


--
-- TOC entry 3926 (class 0 OID 0)
-- Dependencies: 244
-- Name: ChatUser_MatchId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."ChatUser_MatchId_seq"', 10, true);


--
-- TOC entry 3927 (class 0 OID 0)
-- Dependencies: 255
-- Name: DailyLimit_LimitId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."DailyLimit_LimitId_seq"', 11, true);


--
-- TOC entry 3928 (class 0 OID 0)
-- Dependencies: 275
-- Name: EventSubmission_SubmissionId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."EventSubmission_SubmissionId_seq"', 20, true);


--
-- TOC entry 3929 (class 0 OID 0)
-- Dependencies: 277
-- Name: EventVote_VoteId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."EventVote_VoteId_seq"', 15, true);


--
-- TOC entry 3930 (class 0 OID 0)
-- Dependencies: 253
-- Name: Notification_NotificationId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Notification_NotificationId_seq"', 371, true);


--
-- TOC entry 3931 (class 0 OID 0)
-- Dependencies: 251
-- Name: PaymentHistory_HistoryId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PaymentHistory_HistoryId_seq"', 1, false);


--
-- TOC entry 3932 (class 0 OID 0)
-- Dependencies: 269
-- Name: PetAppointmentLocation_LocationId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PetAppointmentLocation_LocationId_seq"', 22, true);


--
-- TOC entry 3933 (class 0 OID 0)
-- Dependencies: 271
-- Name: PetAppointment_AppointmentId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PetAppointment_AppointmentId_seq"', 20, true);


--
-- TOC entry 3934 (class 0 OID 0)
-- Dependencies: 273
-- Name: PetEvent_EventId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PetEvent_EventId_seq"', 29, true);


--
-- TOC entry 3935 (class 0 OID 0)
-- Dependencies: 236
-- Name: PetPhoto_PhotoId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PetPhoto_PhotoId_seq"', 97, true);


--
-- TOC entry 3936 (class 0 OID 0)
-- Dependencies: 234
-- Name: Pet_PetId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Pet_PetId_seq"', 49, true);


--
-- TOC entry 3937 (class 0 OID 0)
-- Dependencies: 265
-- Name: PolicyVersion_PolicyVersionId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."PolicyVersion_PolicyVersionId_seq"', 9, true);


--
-- TOC entry 3938 (class 0 OID 0)
-- Dependencies: 263
-- Name: Policy_PolicyId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Policy_PolicyId_seq"', 5, true);


--
-- TOC entry 3939 (class 0 OID 0)
-- Dependencies: 248
-- Name: Report_ReportId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Report_ReportId_seq"', 5, true);


--
-- TOC entry 3940 (class 0 OID 0)
-- Dependencies: 219
-- Name: Role_RoleId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."Role_RoleId_seq"', 3, true);


--
-- TOC entry 3941 (class 0 OID 0)
-- Dependencies: 227
-- Name: UserBanHistory_BanId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."UserBanHistory_BanId_seq"', 2, true);


--
-- TOC entry 3942 (class 0 OID 0)
-- Dependencies: 267
-- Name: UserPolicyAccept_AcceptId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."UserPolicyAccept_AcceptId_seq"', 46, true);


--
-- TOC entry 3943 (class 0 OID 0)
-- Dependencies: 221
-- Name: UserStatus_UserStatusId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."UserStatus_UserStatusId_seq"', 3, true);


--
-- TOC entry 3944 (class 0 OID 0)
-- Dependencies: 225
-- Name: User_UserId_seq; Type: SEQUENCE SET; Schema: public; Owner: pawnder_user
--

SELECT pg_catalog.setval('public."User_UserId_seq"', 26, true);


--
-- TOC entry 3513 (class 2606 OID 16430)
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("AddressId");


--
-- TOC entry 3523 (class 2606 OID 16510)
-- Name: AttributeOption AttributeOption_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."AttributeOption"
    ADD CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("OptionId");


--
-- TOC entry 3521 (class 2606 OID 16498)
-- Name: Attribute Attribute_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Attribute"
    ADD CONSTRAINT "Attribute_pkey" PRIMARY KEY ("AttributeId");


--
-- TOC entry 3563 (class 2606 OID 16881)
-- Name: BadWord BadWord_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."BadWord"
    ADD CONSTRAINT "BadWord_pkey" PRIMARY KEY ("BadWordId");


--
-- TOC entry 3547 (class 2606 OID 16755)
-- Name: Block Block_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("FromUserId", "ToUserId");


--
-- TOC entry 3537 (class 2606 OID 16634)
-- Name: ChatAIContent ChatAIContent_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAIContent"
    ADD CONSTRAINT "ChatAIContent_pkey" PRIMARY KEY ("ContentId");


--
-- TOC entry 3535 (class 2606 OID 16617)
-- Name: ChatAI ChatAI_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAI"
    ADD CONSTRAINT "ChatAI_pkey" PRIMARY KEY ("ChatAIId");


--
-- TOC entry 3561 (class 2606 OID 16850)
-- Name: ChatExpertContent ChatExpertContent_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpertContent"
    ADD CONSTRAINT "ChatExpertContent_pkey" PRIMARY KEY ("ContentId");


--
-- TOC entry 3559 (class 2606 OID 16828)
-- Name: ChatExpert ChatExpert_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpert"
    ADD CONSTRAINT "ChatExpert_pkey" PRIMARY KEY ("ChatExpertId");


--
-- TOC entry 3543 (class 2606 OID 16709)
-- Name: ChatUserContent ChatUserContent_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUserContent"
    ADD CONSTRAINT "ChatUserContent_pkey" PRIMARY KEY ("ContentId");


--
-- TOC entry 3541 (class 2606 OID 16677)
-- Name: ChatUser ChatUser_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser"
    ADD CONSTRAINT "ChatUser_pkey" PRIMARY KEY ("MatchId");


--
-- TOC entry 3555 (class 2606 OID 16813)
-- Name: DailyLimit DailyLimit_UserId_ActionType_ActionDate_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."DailyLimit"
    ADD CONSTRAINT "DailyLimit_UserId_ActionType_ActionDate_key" UNIQUE ("UserId", "ActionType", "ActionDate");


--
-- TOC entry 3557 (class 2606 OID 16811)
-- Name: DailyLimit DailyLimit_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."DailyLimit"
    ADD CONSTRAINT "DailyLimit_pkey" PRIMARY KEY ("LimitId");


--
-- TOC entry 3595 (class 2606 OID 17206)
-- Name: EventSubmission EventSubmission_EventId_UserId_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission"
    ADD CONSTRAINT "EventSubmission_EventId_UserId_key" UNIQUE ("EventId", "UserId");


--
-- TOC entry 3597 (class 2606 OID 17204)
-- Name: EventSubmission EventSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission"
    ADD CONSTRAINT "EventSubmission_pkey" PRIMARY KEY ("SubmissionId");


--
-- TOC entry 3601 (class 2606 OID 17236)
-- Name: EventVote EventVote_SubmissionId_UserId_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventVote"
    ADD CONSTRAINT "EventVote_SubmissionId_UserId_key" UNIQUE ("SubmissionId", "UserId");


--
-- TOC entry 3603 (class 2606 OID 17234)
-- Name: EventVote EventVote_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventVote"
    ADD CONSTRAINT "EventVote_pkey" PRIMARY KEY ("VoteId");


--
-- TOC entry 3539 (class 2606 OID 16651)
-- Name: ExpertConfirmation ExpertConfirmation_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ExpertConfirmation"
    ADD CONSTRAINT "ExpertConfirmation_pkey" PRIMARY KEY ("ExpertId", "UserId", "ChatAIId");


--
-- TOC entry 3553 (class 2606 OID 16793)
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("NotificationId");


--
-- TOC entry 3549 (class 2606 OID 16775)
-- Name: PaymentHistory PaymentHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PaymentHistory"
    ADD CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("HistoryId");


--
-- TOC entry 3584 (class 2606 OID 17079)
-- Name: PetAppointmentLocation PetAppointmentLocation_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointmentLocation"
    ADD CONSTRAINT "PetAppointmentLocation_pkey" PRIMARY KEY ("LocationId");


--
-- TOC entry 3589 (class 2606 OID 17103)
-- Name: PetAppointment PetAppointment_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_pkey" PRIMARY KEY ("AppointmentId");


--
-- TOC entry 3533 (class 2606 OID 16591)
-- Name: PetCharacteristic PetCharacteristic_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetCharacteristic"
    ADD CONSTRAINT "PetCharacteristic_pkey" PRIMARY KEY ("PetId", "AttributeId");


--
-- TOC entry 3591 (class 2606 OID 17178)
-- Name: PetEvent PetEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetEvent"
    ADD CONSTRAINT "PetEvent_pkey" PRIMARY KEY ("EventId");


--
-- TOC entry 3530 (class 2606 OID 16575)
-- Name: PetPhoto PetPhoto_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetPhoto"
    ADD CONSTRAINT "PetPhoto_pkey" PRIMARY KEY ("PhotoId");


--
-- TOC entry 3527 (class 2606 OID 16553)
-- Name: Pet Pet_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Pet"
    ADD CONSTRAINT "Pet_pkey" PRIMARY KEY ("PetId");


--
-- TOC entry 3575 (class 2606 OID 16925)
-- Name: PolicyVersion PolicyVersion_PolicyId_VersionNumber_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PolicyVersion"
    ADD CONSTRAINT "PolicyVersion_PolicyId_VersionNumber_key" UNIQUE ("PolicyId", "VersionNumber");


--
-- TOC entry 3577 (class 2606 OID 16923)
-- Name: PolicyVersion PolicyVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PolicyVersion"
    ADD CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("PolicyVersionId");


--
-- TOC entry 3569 (class 2606 OID 16903)
-- Name: Policy Policy_PolicyCode_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Policy"
    ADD CONSTRAINT "Policy_PolicyCode_key" UNIQUE ("PolicyCode");


--
-- TOC entry 3571 (class 2606 OID 16901)
-- Name: Policy Policy_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Policy"
    ADD CONSTRAINT "Policy_pkey" PRIMARY KEY ("PolicyId");


--
-- TOC entry 3545 (class 2606 OID 16736)
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY ("ReportId");


--
-- TOC entry 3509 (class 2606 OID 16406)
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("RoleId");


--
-- TOC entry 3519 (class 2606 OID 16480)
-- Name: UserBanHistory UserBanHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserBanHistory"
    ADD CONSTRAINT "UserBanHistory_pkey" PRIMARY KEY ("BanId");


--
-- TOC entry 3582 (class 2606 OID 16951)
-- Name: UserPolicyAccept UserPolicyAccept_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPolicyAccept"
    ADD CONSTRAINT "UserPolicyAccept_pkey" PRIMARY KEY ("AcceptId");


--
-- TOC entry 3525 (class 2606 OID 16524)
-- Name: UserPreference UserPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("UserId", "AttributeId");


--
-- TOC entry 3511 (class 2606 OID 16417)
-- Name: UserStatus UserStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserStatus"
    ADD CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("UserStatusId");


--
-- TOC entry 3515 (class 2606 OID 16447)
-- Name: User User_Email_key; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_Email_key" UNIQUE ("Email");


--
-- TOC entry 3517 (class 2606 OID 16445)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("UserId");


--
-- TOC entry 3564 (class 1259 OID 16882)
-- Name: IX_BadWord_IsActive; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_BadWord_IsActive" ON public."BadWord" USING btree ("IsActive");


--
-- TOC entry 3565 (class 1259 OID 16883)
-- Name: IX_BadWord_Level; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_BadWord_Level" ON public."BadWord" USING btree ("Level");


--
-- TOC entry 3550 (class 1259 OID 17256)
-- Name: IX_Notification_Status; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_Notification_Status" ON public."Notification" USING btree ("Status");


--
-- TOC entry 3551 (class 1259 OID 17255)
-- Name: IX_Notification_UserId_IsRead; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_Notification_UserId_IsRead" ON public."Notification" USING btree ("UserId", "IsRead");


--
-- TOC entry 3585 (class 1259 OID 17146)
-- Name: IX_PetAppointment_DateTime; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PetAppointment_DateTime" ON public."PetAppointment" USING btree ("AppointmentDateTime");


--
-- TOC entry 3586 (class 1259 OID 17144)
-- Name: IX_PetAppointment_MatchId; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PetAppointment_MatchId" ON public."PetAppointment" USING btree ("MatchId");


--
-- TOC entry 3587 (class 1259 OID 17145)
-- Name: IX_PetAppointment_Status; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PetAppointment_Status" ON public."PetAppointment" USING btree ("Status");


--
-- TOC entry 3528 (class 1259 OID 16581)
-- Name: IX_PetPhoto_PetId; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PetPhoto_PetId" ON public."PetPhoto" USING btree ("PetId");


--
-- TOC entry 3572 (class 1259 OID 16936)
-- Name: IX_PolicyVersion_PolicyId_Status; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PolicyVersion_PolicyId_Status" ON public."PolicyVersion" USING btree ("PolicyId", "Status");


--
-- TOC entry 3573 (class 1259 OID 16937)
-- Name: IX_PolicyVersion_Status; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_PolicyVersion_Status" ON public."PolicyVersion" USING btree ("Status");


--
-- TOC entry 3566 (class 1259 OID 16905)
-- Name: IX_Policy_IsActive; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_Policy_IsActive" ON public."Policy" USING btree ("IsActive") WHERE ("IsDeleted" = false);


--
-- TOC entry 3567 (class 1259 OID 16904)
-- Name: IX_Policy_PolicyCode; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_Policy_PolicyCode" ON public."Policy" USING btree ("PolicyCode");


--
-- TOC entry 3578 (class 1259 OID 16964)
-- Name: IX_UserPolicyAccept_PolicyVersionId; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_UserPolicyAccept_PolicyVersionId" ON public."UserPolicyAccept" USING btree ("PolicyVersionId");


--
-- TOC entry 3579 (class 1259 OID 16963)
-- Name: IX_UserPolicyAccept_UserId_IsValid; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_UserPolicyAccept_UserId_IsValid" ON public."UserPolicyAccept" USING btree ("UserId", "IsValid");


--
-- TOC entry 3580 (class 1259 OID 16962)
-- Name: IX_UserPolicyAccept_UserId_PolicyVersionId_IsValid; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX "IX_UserPolicyAccept_UserId_PolicyVersionId_IsValid" ON public."UserPolicyAccept" USING btree ("UserId", "PolicyVersionId", "IsValid");


--
-- TOC entry 3531 (class 1259 OID 16582)
-- Name: UX_PetPhoto_OnePrimaryPerPet; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE UNIQUE INDEX "UX_PetPhoto_OnePrimaryPerPet" ON public."PetPhoto" USING btree ("PetId", "IsPrimary") WHERE (("IsDeleted" = false) AND ("IsPrimary" = true));


--
-- TOC entry 3592 (class 1259 OID 17185)
-- Name: idx_event_endtime; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX idx_event_endtime ON public."PetEvent" USING btree ("EndTime");


--
-- TOC entry 3593 (class 1259 OID 17184)
-- Name: idx_event_status; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX idx_event_status ON public."PetEvent" USING btree ("Status");


--
-- TOC entry 3598 (class 1259 OID 17222)
-- Name: idx_submission_event; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX idx_submission_event ON public."EventSubmission" USING btree ("EventId");


--
-- TOC entry 3599 (class 1259 OID 17223)
-- Name: idx_submission_votes; Type: INDEX; Schema: public; Owner: pawnder_user
--

CREATE INDEX idx_submission_votes ON public."EventSubmission" USING btree ("EventId", "VoteCount" DESC);


--
-- TOC entry 3608 (class 2606 OID 16511)
-- Name: AttributeOption AttributeOption_AttributeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."AttributeOption"
    ADD CONSTRAINT "AttributeOption_AttributeId_fkey" FOREIGN KEY ("AttributeId") REFERENCES public."Attribute"("AttributeId");


--
-- TOC entry 3631 (class 2606 OID 16756)
-- Name: Block Block_FromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_FromUserId_fkey" FOREIGN KEY ("FromUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3632 (class 2606 OID 16761)
-- Name: Block Block_ToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_ToUserId_fkey" FOREIGN KEY ("ToUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3618 (class 2606 OID 16635)
-- Name: ChatAIContent ChatAIContent_ChatAIId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAIContent"
    ADD CONSTRAINT "ChatAIContent_ChatAIId_fkey" FOREIGN KEY ("ChatAIId") REFERENCES public."ChatAI"("ChatAIId");


--
-- TOC entry 3617 (class 2606 OID 16618)
-- Name: ChatAI ChatAI_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatAI"
    ADD CONSTRAINT "ChatAI_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3639 (class 2606 OID 16851)
-- Name: ChatExpertContent ChatExpertContent_ChatExpertId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpertContent"
    ADD CONSTRAINT "ChatExpertContent_ChatExpertId_fkey" FOREIGN KEY ("ChatExpertId") REFERENCES public."ChatExpert"("ChatExpertId");


--
-- TOC entry 3640 (class 2606 OID 16861)
-- Name: ChatExpertContent ChatExpertContent_ExpertId_UserId_ChatAIId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpertContent"
    ADD CONSTRAINT "ChatExpertContent_ExpertId_UserId_ChatAIId_fkey" FOREIGN KEY ("ExpertId", "UserId", "ChatAIId") REFERENCES public."ExpertConfirmation"("ExpertId", "UserId", "ChatAIId");


--
-- TOC entry 3641 (class 2606 OID 16856)
-- Name: ChatExpertContent ChatExpertContent_FromId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpertContent"
    ADD CONSTRAINT "ChatExpertContent_FromId_fkey" FOREIGN KEY ("FromId") REFERENCES public."User"("UserId");


--
-- TOC entry 3637 (class 2606 OID 16829)
-- Name: ChatExpert ChatExpert_ExpertId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpert"
    ADD CONSTRAINT "ChatExpert_ExpertId_fkey" FOREIGN KEY ("ExpertId") REFERENCES public."User"("UserId");


--
-- TOC entry 3638 (class 2606 OID 16834)
-- Name: ChatExpert ChatExpert_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatExpert"
    ADD CONSTRAINT "ChatExpert_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3626 (class 2606 OID 16720)
-- Name: ChatUserContent ChatUserContent_FromPetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUserContent"
    ADD CONSTRAINT "ChatUserContent_FromPetId_fkey" FOREIGN KEY ("FromPetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3627 (class 2606 OID 16715)
-- Name: ChatUserContent ChatUserContent_FromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUserContent"
    ADD CONSTRAINT "ChatUserContent_FromUserId_fkey" FOREIGN KEY ("FromUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3628 (class 2606 OID 16710)
-- Name: ChatUserContent ChatUserContent_MatchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUserContent"
    ADD CONSTRAINT "ChatUserContent_MatchId_fkey" FOREIGN KEY ("MatchId") REFERENCES public."ChatUser"("MatchId");


--
-- TOC entry 3622 (class 2606 OID 16678)
-- Name: ChatUser ChatUser_FromPetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser"
    ADD CONSTRAINT "ChatUser_FromPetId_fkey" FOREIGN KEY ("FromPetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3623 (class 2606 OID 16688)
-- Name: ChatUser ChatUser_FromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser"
    ADD CONSTRAINT "ChatUser_FromUserId_fkey" FOREIGN KEY ("FromUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3624 (class 2606 OID 16683)
-- Name: ChatUser ChatUser_ToPetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser"
    ADD CONSTRAINT "ChatUser_ToPetId_fkey" FOREIGN KEY ("ToPetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3625 (class 2606 OID 16693)
-- Name: ChatUser ChatUser_ToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ChatUser"
    ADD CONSTRAINT "ChatUser_ToUserId_fkey" FOREIGN KEY ("ToUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3636 (class 2606 OID 16814)
-- Name: DailyLimit DailyLimit_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."DailyLimit"
    ADD CONSTRAINT "DailyLimit_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3655 (class 2606 OID 17207)
-- Name: EventSubmission EventSubmission_EventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission"
    ADD CONSTRAINT "EventSubmission_EventId_fkey" FOREIGN KEY ("EventId") REFERENCES public."PetEvent"("EventId");


--
-- TOC entry 3656 (class 2606 OID 17217)
-- Name: EventSubmission EventSubmission_PetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission"
    ADD CONSTRAINT "EventSubmission_PetId_fkey" FOREIGN KEY ("PetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3657 (class 2606 OID 17212)
-- Name: EventSubmission EventSubmission_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventSubmission"
    ADD CONSTRAINT "EventSubmission_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3658 (class 2606 OID 17237)
-- Name: EventVote EventVote_SubmissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventVote"
    ADD CONSTRAINT "EventVote_SubmissionId_fkey" FOREIGN KEY ("SubmissionId") REFERENCES public."EventSubmission"("SubmissionId");


--
-- TOC entry 3659 (class 2606 OID 17242)
-- Name: EventVote EventVote_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."EventVote"
    ADD CONSTRAINT "EventVote_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3619 (class 2606 OID 16662)
-- Name: ExpertConfirmation ExpertConfirmation_ChatAIId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ExpertConfirmation"
    ADD CONSTRAINT "ExpertConfirmation_ChatAIId_fkey" FOREIGN KEY ("ChatAIId") REFERENCES public."ChatAI"("ChatAIId");


--
-- TOC entry 3620 (class 2606 OID 16652)
-- Name: ExpertConfirmation ExpertConfirmation_ExpertId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ExpertConfirmation"
    ADD CONSTRAINT "ExpertConfirmation_ExpertId_fkey" FOREIGN KEY ("ExpertId") REFERENCES public."User"("UserId");


--
-- TOC entry 3621 (class 2606 OID 16657)
-- Name: ExpertConfirmation ExpertConfirmation_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."ExpertConfirmation"
    ADD CONSTRAINT "ExpertConfirmation_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3634 (class 2606 OID 17250)
-- Name: Notification Notification_CreatedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3635 (class 2606 OID 16794)
-- Name: Notification Notification_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3633 (class 2606 OID 16776)
-- Name: PaymentHistory PaymentHistory_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PaymentHistory"
    ADD CONSTRAINT "PaymentHistory_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3646 (class 2606 OID 17139)
-- Name: PetAppointment PetAppointment_CancelledBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_CancelledBy_fkey" FOREIGN KEY ("CancelledBy") REFERENCES public."User"("UserId");


--
-- TOC entry 3647 (class 2606 OID 17134)
-- Name: PetAppointment PetAppointment_CurrentDecisionUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_CurrentDecisionUserId_fkey" FOREIGN KEY ("CurrentDecisionUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3648 (class 2606 OID 17114)
-- Name: PetAppointment PetAppointment_InviteePetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_InviteePetId_fkey" FOREIGN KEY ("InviteePetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3649 (class 2606 OID 17124)
-- Name: PetAppointment PetAppointment_InviteeUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_InviteeUserId_fkey" FOREIGN KEY ("InviteeUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3650 (class 2606 OID 17109)
-- Name: PetAppointment PetAppointment_InviterPetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_InviterPetId_fkey" FOREIGN KEY ("InviterPetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3651 (class 2606 OID 17119)
-- Name: PetAppointment PetAppointment_InviterUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_InviterUserId_fkey" FOREIGN KEY ("InviterUserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3652 (class 2606 OID 17129)
-- Name: PetAppointment PetAppointment_LocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_LocationId_fkey" FOREIGN KEY ("LocationId") REFERENCES public."PetAppointmentLocation"("LocationId");


--
-- TOC entry 3653 (class 2606 OID 17104)
-- Name: PetAppointment PetAppointment_MatchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetAppointment"
    ADD CONSTRAINT "PetAppointment_MatchId_fkey" FOREIGN KEY ("MatchId") REFERENCES public."ChatUser"("MatchId");


--
-- TOC entry 3614 (class 2606 OID 16597)
-- Name: PetCharacteristic PetCharacteristic_AttributeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetCharacteristic"
    ADD CONSTRAINT "PetCharacteristic_AttributeId_fkey" FOREIGN KEY ("AttributeId") REFERENCES public."Attribute"("AttributeId");


--
-- TOC entry 3615 (class 2606 OID 16602)
-- Name: PetCharacteristic PetCharacteristic_OptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetCharacteristic"
    ADD CONSTRAINT "PetCharacteristic_OptionId_fkey" FOREIGN KEY ("OptionId") REFERENCES public."AttributeOption"("OptionId");


--
-- TOC entry 3616 (class 2606 OID 16592)
-- Name: PetCharacteristic PetCharacteristic_PetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetCharacteristic"
    ADD CONSTRAINT "PetCharacteristic_PetId_fkey" FOREIGN KEY ("PetId") REFERENCES public."Pet"("PetId");


--
-- TOC entry 3654 (class 2606 OID 17179)
-- Name: PetEvent PetEvent_CreatedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetEvent"
    ADD CONSTRAINT "PetEvent_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES public."User"("UserId");


--
-- TOC entry 3613 (class 2606 OID 16576)
-- Name: PetPhoto PetPhoto_PetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PetPhoto"
    ADD CONSTRAINT "PetPhoto_PetId_fkey" FOREIGN KEY ("PetId") REFERENCES public."Pet"("PetId") ON DELETE CASCADE;


--
-- TOC entry 3612 (class 2606 OID 16554)
-- Name: Pet Pet_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Pet"
    ADD CONSTRAINT "Pet_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3642 (class 2606 OID 16931)
-- Name: PolicyVersion PolicyVersion_CreatedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PolicyVersion"
    ADD CONSTRAINT "PolicyVersion_CreatedByUserId_fkey" FOREIGN KEY ("CreatedByUserId") REFERENCES public."User"("UserId") ON DELETE SET NULL;


--
-- TOC entry 3643 (class 2606 OID 16926)
-- Name: PolicyVersion PolicyVersion_PolicyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."PolicyVersion"
    ADD CONSTRAINT "PolicyVersion_PolicyId_fkey" FOREIGN KEY ("PolicyId") REFERENCES public."Policy"("PolicyId") ON DELETE CASCADE;


--
-- TOC entry 3629 (class 2606 OID 16742)
-- Name: Report Report_ContentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_ContentId_fkey" FOREIGN KEY ("ContentId") REFERENCES public."ChatUserContent"("ContentId");


--
-- TOC entry 3630 (class 2606 OID 16737)
-- Name: Report Report_UserReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_UserReportId_fkey" FOREIGN KEY ("UserReportId") REFERENCES public."User"("UserId");


--
-- TOC entry 3607 (class 2606 OID 16481)
-- Name: UserBanHistory UserBanHistory_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserBanHistory"
    ADD CONSTRAINT "UserBanHistory_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId") ON DELETE CASCADE;


--
-- TOC entry 3644 (class 2606 OID 16957)
-- Name: UserPolicyAccept UserPolicyAccept_PolicyVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPolicyAccept"
    ADD CONSTRAINT "UserPolicyAccept_PolicyVersionId_fkey" FOREIGN KEY ("PolicyVersionId") REFERENCES public."PolicyVersion"("PolicyVersionId") ON DELETE CASCADE;


--
-- TOC entry 3645 (class 2606 OID 16952)
-- Name: UserPolicyAccept UserPolicyAccept_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPolicyAccept"
    ADD CONSTRAINT "UserPolicyAccept_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId") ON DELETE CASCADE;


--
-- TOC entry 3609 (class 2606 OID 16530)
-- Name: UserPreference UserPreference_AttributeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_AttributeId_fkey" FOREIGN KEY ("AttributeId") REFERENCES public."Attribute"("AttributeId");


--
-- TOC entry 3610 (class 2606 OID 16535)
-- Name: UserPreference UserPreference_OptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_OptionId_fkey" FOREIGN KEY ("OptionId") REFERENCES public."AttributeOption"("OptionId");


--
-- TOC entry 3611 (class 2606 OID 16525)
-- Name: UserPreference UserPreference_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."User"("UserId");


--
-- TOC entry 3604 (class 2606 OID 16458)
-- Name: User User_AddressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_AddressId_fkey" FOREIGN KEY ("AddressId") REFERENCES public."Address"("AddressId");


--
-- TOC entry 3605 (class 2606 OID 16448)
-- Name: User User_RoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_RoleId_fkey" FOREIGN KEY ("RoleId") REFERENCES public."Role"("RoleId");


--
-- TOC entry 3606 (class 2606 OID 16453)
-- Name: User User_UserStatusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pawnder_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_UserStatusId_fkey" FOREIGN KEY ("UserStatusId") REFERENCES public."UserStatus"("UserStatusId");


--
-- TOC entry 2204 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO pawnder_user;


--
-- TOC entry 2206 (class 826 OID 16393)
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO pawnder_user;


--
-- TOC entry 2205 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO pawnder_user;


--
-- TOC entry 2203 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO pawnder_user;


-- Completed on 2026-02-02 09:33:18

--
-- PostgreSQL database dump complete
--

\unrestrict ff7caTLc6PxbwqiSNDVyrCQQov640iQcMdJMgbpBPtyCYg37GQyHbDFXgeaHo31

