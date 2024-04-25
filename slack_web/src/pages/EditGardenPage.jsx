import React, { useEffect, useRef, useState } from "react";

import Layout from "./Layout";
import InputField from "../components/InputField";
import Container from "../components/Container";
import PlanViewer from "../components/PlanViewer";
import ScrollView from "../components/ScrollView";
import AffiliateCapsule from "../components/AffiliateCapsule";
import AreaCapsule from "../components/AreaCapsule";
import Pagination from "../components/Pagination";
import IncrementalNumber from "../components/IncrementalNumber";
import Modal from "../components/Modal";

import { FaPlus } from "react-icons/fa6";
import { FaSave } from "react-icons/fa";
import { useAuth } from "../components/AuthProvider";
import { twMerge } from "tailwind-merge";
import axiosRetry from "axios-retry";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import getApiUrl from "../utils/url";

axiosRetry(axios, {
    retries: 3,
    retryCondition(error) {
        switch (error.response.status) {
            case 500:
                return true;
            default:
                return false;
        }
    },
    retryDelay: axiosRetry.exponentialDelay,
});

const EditGardenPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setToken } = useAuth();
    const maxGardenSize = 20;
    const [isLoading, setIsLoading] = useState(true);
    const [gardenID, setGardenID] = useState(undefined);
    const [gardenName, setGardenName] = useState("");
    const [currentAreaSelected, setCurrentAreaSelected] = useState(-1);
    const [length, setLength] = useState(undefined);
    const [width, setWidth] = useState(undefined);
    const [content, setContent] = useState(undefined);
    const [areas, setAreas] = useState([]);
    const [address, setAddress] = useState("");
    const [affiliates, setAffiliates] = useState([]);
    const [areasToDelete, setAreaToDelete] = useState([]);

    const [affiliationCurrentPage, setAffiliationCurrentPage] = useState(1);
    const [
        animationAffiliationControllerClassName,
        setAnimationAffiliationControllerClassName,
    ] = useState("");

    const [areaCurrentPage, setAreaCurrentPage] = useState(1);
    const [
        animationAreaControllerClassName,
        setAnimationAreaControllerClassName,
    ] = useState("");

    const [modalAddressOpened, setModalAddressOpened] = useState(false);
    const [modalAddressErrorMessage, setModalAddressErrorMessage] =
        useState("");

    const [modalAreaOpened, setModalAreaOpened] = useState(false);
    const [modalAreaErrorMessage, setModalAreaErrorMessage] = useState("");

    let inputRefs = {};
    inputRefs.nameRef = useRef();
    inputRefs.streetRef = useRef();
    inputRefs.cityRef = useRef();
    inputRefs.postCodeRef = useRef();
    inputRefs.areaNameRef = useRef();
    inputRefs.areaDescRef = useRef();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        await axios
            .get(getApiUrl("/v1/garden/own-created-garden"))
            .then((response) => {
                fetchAreas(response.data.id);

                fetchAffiliated(response.data.id);

                setWidth(response.data.plan.meta.sizeY);
                setLength(response.data.plan.meta.sizeX);
                setContent(response.data.plan.content);
                setGardenName(response.data.name);
                setAddress(response.data.address);
                setGardenID(response.data.id);
                setIsLoading(false);
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message == "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (reason.response.status === 404) {
                    //Current user own garden not found (not owner)
                    toast(t("components.notification.not-owner"), {
                        type: "warning",
                    });
                    setTimeout(() => {
                        navigate("/");
                    }, 1000);
                } else if (reason.response.status !== 401) {
                    toast(t("components.notification.fetch"), {
                        type: "error",
                    });
                }
            });
    };

    const fetchAreas = async (gardenID) => {
        axios
            .get(getApiUrl(`/v1/area/${gardenID}`))
            .then((response) => {
                setAreas([]);

                for (let area of response.data) {
                    addAreaInitial(area);
                }
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message == "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (reason.response.status === 403) {
                    navigate("/create-garden");
                    toast(t("components.notification.not-affiliate"), {
                        type: "warning",
                    });
                } else if (reason.response.status !== 401) {
                    toast(t("components.notification.fetch"), {
                        type: "error",
                    });
                }
            });
    };

    const onDeleteAffiliate = (affiliate) => {
        axios
            .delete(getApiUrl("/v1/garden/remove-member"), {
                data: {
                    user: affiliate.email,
                    garden: affiliate.gardenID,
                },
            })
            .then(() => {
                fetchAffiliated(gardenID);
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message == "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 403 &&
                    reason.response.message === "NOT_OWNER"
                ) {
                    toast(t("components.notification.not-owner"), {
                        type: "error",
                    });
                } else if (reason.response.status === 403) {
                    toast(t("components.notification.self-delete"), {
                        type: "warning",
                    });
                } else if (reason.response.status !== 401) {
                    toast(t("components.notification.fetch"), {
                        type: "error",
                    });
                }
            });
    };

    const onEditAffiliate = (affiliate) => {
        axios
            .patch(getApiUrl("1/v1/garden/give-ownership"), {
                user: affiliate.email,
                garden: affiliate.gardenID,
            })
            .then((response) => {
                navigate("/my-gardens");
                toast(t("components.notification.transition-ownership"), {
                    type: "success",
                });
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message === "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 403 &&
                    reason.response.message === "NOT_OWNER"
                ) {
                    toast(t("components.notification.not-owner"), {
                        type: "error",
                    });
                } else if (reason.response.status === 403) {
                    toast(
                        t(
                            "components.notification.transition-failed-already-owner"
                        ),
                        { type: "warning" }
                    );
                } else if (reason.response.status !== 401) {
                    toast(t("components.notification.fetch"), {
                        type: "error",
                    });
                }
            });
    };

    const fetchAffiliated = async (gardenID) => {
        axios
            .get(getApiUrl(`/v1/affiliate/${gardenID}`))
            .then((response) => {
                setAffiliates(response.data);
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message == "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 403 &&
                    reason.response.message === "NOT_AFFILIATE"
                ) {
                    navigate("/");
                    toast(t("components.notification.not-affiliate"), {
                        type: "error",
                    });
                } else if (reason.response.status !== 401) {
                    toast(t("components.notification.fetch"), {
                        type: "error",
                    });
                }
            });
    };

    useEffect(() => {
        if (!modalAreaOpened && modalAreaErrorMessage)
            setModalAreaErrorMessage("");
    }, [modalAreaOpened]);

    const onSave = () => {
        if (!inputRefs.nameRef.current.value) {
            toast(t("pages.create-garden.error-messages.name-empty"), {
                type: "error",
            });
            return;
        }

        if (!address) {
            toast(t("pages.create-garden.error-messages.address-empty"), {
                type: "error",
            });
            return;
        }

        const jsonString = JSON.stringify({
            meta: {
                sizeX: length,
                sizeY: width,
            },
            content: content,
        });

        const payload = {
            garden: {
                name: inputRefs.nameRef.current.value,
                address: address,
                plan: jsonString,
            },
            areasDeleted: areasToDelete,
            areas: areas,
        };

        axios
            .post(getApiUrl("/v1/garden/edit"), payload)
            .then((response) => {
                navigate("/my-gardens");
                toast(t("pages.create-garden.garden-edited"), {
                    type: "success",
                });
                fetchInitialData();
            })
            .catch((reason) => {
                if (reason.code === "ERR_NETWORK") {
                    navigate("/");
                    toast(t("components.notification.timed-out"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.message == "TOKEN_EXPIRED"
                ) {
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 401 &&
                    reason.response.data == "TOKEN_INVALID"
                ) {
                    setToken();
                    navigate("/login");
                    toast(t("components.notification.must_be_logged_in"), {
                        type: "error",
                    });
                } else if (
                    reason.response.status === 403 &&
                    reason.response.message === "NOT_OWNER"
                ) {
                    navigate("/");
                    toast(t("components.notification.not-owner"), {
                        type: "error",
                    });
                } else if (reason.response.status !== 401) {
                    toast(t("pages.create-garden.error-messages.creation"), {
                        type: "error",
                    });
                }
            });
    };

    const changePage = async (stateClassNameFn, statePageFn, pageIndex) => {
        stateClassNameFn("opacity-0");
        await new Promise((res) => setTimeout(res, 400));
        statePageFn(pageIndex);
        stateClassNameFn("");
    };

    const onModalAddressSave = () => {
        if (
            !inputRefs.streetRef.current.value ||
            !inputRefs.postCodeRef.current.value ||
            !inputRefs.cityRef.current.value
        ) {
            setModalAddressErrorMessage(
                t("pages.create-garden.modal-address.error-message")
            );
            return;
        }

        setModalAddressErrorMessage("");
        const street = inputRefs.streetRef.current.value;
        const postCode = inputRefs.postCodeRef.current.value;
        const city = inputRefs.cityRef.current.value;
        setAddress(`${street},#${postCode} ${city}#Belgique`);
        setModalAddressOpened(false);
    };

    const onChangeLength = (current, newLength) => {
        if (newLength < 1 || newLength > maxGardenSize || length === newLength)
            return current;

        let newContent = current;

        if (newLength > length) {
            for (let row of newContent) {
                row[length] = null;
            }
        } else {
            for (let row of newContent) {
                delete row[length];
                row.length--;
            }
        }

        setLength(newLength);

        return newContent;
    };

    const onChangeWidth = (current, newWidth) => {
        if (newWidth < 1 || newWidth > maxGardenSize || width === newWidth)
            return current;

        let newContent = current;

        if (newWidth > width) {
            newContent[width] = new Array(length).fill(null);
        } else {
            delete newContent[width];
            newContent.length--;
        }

        setWidth(newWidth);

        return newContent;
    };

    const makeAddressForTextArea = (address) => {
        if (address) return address.replaceAll("#", "\n");
        else return "";
    };

    const addArea = () => {
        if (!inputRefs.areaNameRef.current.value) {
            setModalAreaErrorMessage(
                t("pages.create-garden.modal-area.error-message")
            );
            return;
        }

        setAreas((oldAreasArray) => [
            ...oldAreasArray,
            {
                area_index: oldAreasArray.length,
                name: inputRefs.areaNameRef.current.value,
                description:
                    inputRefs.areaDescRef.current.value === ""
                        ? null
                        : inputRefs.areaDescRef.current.value,
            },
        ]);

        setModalAreaOpened(false);
    };

    const addAreaInitial = (area) => {
        setAreas((oldAreasArray) => [
            ...oldAreasArray,
            {
                id: area.id,
                area_index: oldAreasArray.length,
                name: area.name,
                description: area.description === "" ? null : area.description,
            },
        ]);
    };

    const onDeleteArea = (areaIndex) => {
        setCurrentAreaSelected(-1);

        if ("id" in areas[areaIndex]) {
            setAreaToDelete((oldAreasToDelete) => {
                return [...oldAreasToDelete, areas[areaIndex].id];
            });
        }

        setAreas((oldAreas) => {
            let areas = [...oldAreas];
            areas.splice(areaIndex, 1);
            for (let i = areaIndex; i < areas.length; i++) {
                areas[i].area_index--;
            }

            return areas;
        });

        setContent((oldContent) => {
            let content = [...oldContent];

            for (let row of content) {
                for (let i = 0; i < row.length; i++) {
                    if (row[i] === areaIndex) row[i] = null;
                    else if (row[i] > areaIndex) row[i]--;
                }
            }

            return content;
        });
    };

    if (isLoading)
        return (
            <Layout className="justify-start ps-28 pe-28" authRequired={true}>
                <div className="flex justify-center items-center w-full h-full bg-bg_gray overflow-hidden outline-none">
                    <svg
                        aria-hidden="true"
                        className="w-12 h-12 mr-2 animate-spin fill-green1 text-gray0"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                        />
                    </svg>
                    <span className="sr-only">Loading...</span>
                </div>
            </Layout>
        );

    return (
        <>
            <Layout className="justify-start ps-28 pe-28" authRequired={true}>
                <span className="w-full text-4xl font-medium text-gray1">
                    Editor Mode
                </span>
                <ScrollView className="flex flex-row flex-wrap px-0 mt-3">
                    <div className="flex flex-row justify-between px-4 w-full">
                        <div className="w-2/5 flex flex-row flex-wrap space-y-6 z-10 mb-48">
                            <span className="font-medium text-3xl text-gray1 mb-4 w-full">
                                {t("pages.create-garden.subtitle-garden")}
                            </span>
                            <label htmlFor="#garden_name" className="ms-2">
                                {t("pages.create-garden.input-name")}
                            </label>
                            <InputField
                                ref={inputRefs.nameRef}
                                id="#garden_name"
                                className="w-full"
                                defaultValue={gardenName}
                            />
                            <label htmlFor="#address" className="ms-2">
                                {t("pages.create-garden.input-address")}
                            </label>
                            <textarea
                                onClick={() => setModalAddressOpened(true)}
                                value={makeAddressForTextArea(address)}
                                readOnly={true}
                                className="cursor-pointer select-none resize-none bg-bg_gray focus:outline-none rounded-2xl px-5 py-3 text-xl text-gray2 shadow-[inset_-5px_-5px_4px_0px_rgba(255,255,255,.5),inset_5px_5px_4px_0px_rgba(70,70,70,.12)] w-full h-28"></textarea>
                        </div>

                        <section className="w-2/5 h-[500px] space-y-4">
                            <span className="font-medium text-3xl text-gray1">
                                Affiliates
                            </span>
                            <div
                                className={twMerge(
                                    "transition-opacity opacity-100 ease-in duration-400 w-full h-[350px] flex flex-col space-y-6",
                                    animationAffiliationControllerClassName
                                )}>
                                {affiliates
                                    .slice(
                                        (affiliationCurrentPage - 1) * 5,
                                        (affiliationCurrentPage - 1) * 5 + 5
                                    )
                                    .map((affiliate, index) => (
                                        <AffiliateCapsule
                                            key={index}
                                            affiliate={affiliate}
                                            onDelete={onDeleteAffiliate}
                                            onEdit={onEditAffiliate}
                                        />
                                    ))}
                            </div>
                            <Pagination
                                rows={5}
                                itemCount={affiliates.length}
                                currentPageState={[
                                    affiliationCurrentPage,
                                    (pageIndex) =>
                                        changePage(
                                            setAnimationAffiliationControllerClassName,
                                            setAffiliationCurrentPage,
                                            pageIndex
                                        ),
                                ]}
                            />
                        </section>
                    </div>

                    <section className="flex flex-row flex-wrap w-full px-4 justify-between">
                        <div className="w-1/2 flex flex-row flex-wrap justify-between">
                            <span className="font-medium text-3xl text-gray1 w-full mb-4">
                                {t("pages.create-garden.subtitle-plan")}
                            </span>
                            <div className="w-full flex flex-wrap flex-row justify-between mb-4 pe-4">
                                <div className="w-1/2 flex flex-row flex-wrap items-center ">
                                    <label htmlFor="#sizeX" className="me-2">
                                        {t("pages.create-garden.config-x")}
                                    </label>
                                    <IncrementalNumber
                                        initialState={length}
                                        className="h-8"
                                        onChange={(newLength) =>
                                            setContent((current) =>
                                                onChangeLength(
                                                    current,
                                                    newLength
                                                )
                                            )
                                        }
                                        min={1}
                                        max={maxGardenSize}
                                    />
                                </div>
                                <div className="w-1/2 flex flex-row flex-wrap justify-end items-center">
                                    <label htmlFor="#sizeY" className="me-2">
                                        {t("pages.create-garden.config-y")}
                                    </label>
                                    <IncrementalNumber
                                        initialState={width}
                                        className="h-8"
                                        onChange={(newWidth) =>
                                            setContent((current) =>
                                                onChangeWidth(current, newWidth)
                                            )
                                        }
                                        min={1}
                                        max={maxGardenSize}
                                    />
                                </div>
                            </div>
                            <Container className="w-full aspect-video focus-within:border-4 focus-within:border-green1 ">
                                <PlanViewer
                                    editable={true}
                                    contentState={[content, setContent]}
                                    xCount={length}
                                    yCount={width}
                                    currentAreaSelected={currentAreaSelected}
                                />
                            </Container>
                        </div>

                        <div className="w-2/5 flex flex-row flex-wrap justify-between">
                            <div className="w-full flex justify-between pe-4">
                                <span className="font-medium text-3xl text-gray1 ">
                                    {t("pages.create-garden.subtitle-areas")}
                                </span>{" "}
                                <button
                                    onClick={() => setModalAreaOpened(true)}
                                    className="bg-green2 h-8 aspect-square flex justify-center items-center rounded-4xl active:scale-90 transition-all duration-100">
                                    <FaPlus
                                        color="#fff"
                                        className="scale-125"
                                    />
                                </button>
                            </div>
                            <section className="w-full h-[300px]">
                                <div
                                    className={twMerge(
                                        "transition-opacity opacity-100 ease-in duration-400 w-full h-[350px] flex flex-col space-y-6",
                                        animationAreaControllerClassName
                                    )}>
                                    {areas
                                        .slice(
                                            (areaCurrentPage - 1) * 5,
                                            (areaCurrentPage - 1) * 5 + 5
                                        )
                                        .map((area) => (
                                            <AreaCapsule
                                                key={area.index}
                                                area={area}
                                                onDelete={onDeleteArea}
                                                currentAreaState={[
                                                    currentAreaSelected,
                                                    setCurrentAreaSelected,
                                                ]}
                                            />
                                        ))}
                                </div>
                                <Pagination
                                    rows={5}
                                    itemCount={areas.length}
                                    currentPageState={[
                                        areaCurrentPage,
                                        (pageIndex) =>
                                            changePage(
                                                setAnimationAreaControllerClassName,
                                                setAreaCurrentPage,
                                                pageIndex
                                            ),
                                    ]}
                                />
                            </section>
                        </div>
                    </section>
                </ScrollView>
            </Layout>
            <button
                onClick={() => onSave()}
                className="z-20 absolute bottom-8 right-8 bg-white rounded-5xl w-16 h-16 max-2xl:bg-green1 flex justify-center items-center">
                <FaSave className="scale-150 max-2xl:fill-white fill-green1" />
            </button>

            <Modal
                showModal={modalAddressOpened}
                onCloseRequested={() => setModalAddressOpened(false)}
                className="flex flex-col bg-bg_gray w-[500px] h-[420px]">
                <div className="w-full border-b-[1px] border-green1/50">
                    <span className="pl-8 w-full text-2xl font-bold">
                        {t("pages.create-garden.modal-address.title")}
                    </span>
                </div>
                <div className="w-full flex flex-row flex-wrap items-center mt-4 justify-between">
                    <label
                        htmlFor="#street"
                        className="me-5 font-medium text-gray1 text-lg">
                        {t("pages.create-garden.modal-address.input-street")}
                    </label>
                    <InputField
                        ref={inputRefs.streetRef}
                        id="#street"
                        className="w-120"
                        defaultValue={address.split("#")[0].slice(0, -1)}
                    />
                </div>
                <div className="w-full flex flex-row flex-wrap items-center mt-4 justify-between">
                    <label
                        htmlFor="#city"
                        className="me-5 font-medium text-gray1 text-lg">
                        {t("pages.create-garden.modal-address.input-city")}
                    </label>
                    <InputField
                        ref={inputRefs.cityRef}
                        id="#city"
                        className="w-120"
                        defaultValue={address.split("#")[1].split(" ")[1]}
                    />
                </div>
                <div className="w-full flex flex-row flex-wrap items-center mt-4 justify-between">
                    <label
                        htmlFor="#postCode"
                        className="me-5 font-medium text-gray1 text-lg">
                        {t("pages.create-garden.modal-address.input-postcode")}
                    </label>
                    <InputField
                        ref={inputRefs.postCodeRef}
                        id="#postCode"
                        className="w-120"
                        defaultValue={address.split("#")[1].split(" ")[0]}
                    />
                </div>

                <span className="w-full text-center text-red mt-8 h-6">
                    {modalAddressErrorMessage}
                </span>

                <div className="w-full flex flex-row justify-center space-x-6 mt-8 place-self-end">
                    <button
                        onClick={() => onModalAddressSave()}
                        className="active:scale-90 transition-all duration-100 w-32 h-12 rounded-3xl bg-green2 text-white font-medium p-2">
                        {t("pages.create-garden.modal-address.button-save")}
                    </button>

                    <button
                        onClick={() => setModalAddressOpened(false)}
                        className="active:scale-90 transition-all duration-100 w-32 h-12 rounded-3xl bg-red/80 text-white font-medium p-2">
                        {t("pages.create-garden.modal-address.button-close")}
                    </button>
                </div>
            </Modal>

            <Modal
                showModal={modalAreaOpened}
                onCloseRequested={() => setModalAreaOpened(false)}
                className="flex flex-col bg-bg_gray w-[500px] h-[420px]">
                <div className="w-full border-b-[1px] border-green1/50">
                    <span className="pl-8 w-full text-2xl font-bold">
                        {t("pages.create-garden.modal-area.title")}
                    </span>
                </div>
                <div className="w-full flex flex-row flex-wrap items-center mt-4 justify-between">
                    <label
                        htmlFor="#street"
                        className="me-5 font-medium text-gray1 text-lg">
                        {t("pages.create-garden.modal-area.input-name")}
                    </label>
                    <InputField
                        ref={inputRefs.areaNameRef}
                        id="#street"
                        className="w-120"
                    />
                </div>

                <div className="w-full flex flex-row flex-wrap items-center mt-4 justify-between">
                    <label
                        htmlFor="#street"
                        className="me-5 font-medium text-gray1 text-lg">
                        {t("pages.create-garden.modal-area.input-desc")}
                    </label>
                    <textarea
                        ref={inputRefs.areaDescRef}
                        id="#street"
                        className="resize-none bg-bg_gray focus:outline-none rounded-2xl ps-6 pe-5 py-3 text-xl text-gray2 shadow-[inset_-5px_-5px_4px_0px_rgba(255,255,255,.5),inset_5px_5px_4px_0px_rgba(70,70,70,.12)] w-120 h-28"
                    />
                </div>

                <span className="w-full text-center text-red mt-8 h-6">
                    {modalAreaErrorMessage}
                </span>

                <div className="w-full flex flex-row justify-center space-x-6 mt-8 place-self-end">
                    <button
                        onClick={addArea}
                        className="active:scale-90 transition-all duration-100 w-32 h-12 rounded-3xl bg-green2 text-white font-medium p-2">
                        {t("pages.create-garden.modal-area.button-add")}
                    </button>

                    <button
                        onClick={() => setModalAreaOpened(false)}
                        className="active:scale-90 transition-all duration-100 w-32 h-12 rounded-3xl bg-red/80 text-white font-medium p-2">
                        {t("pages.create-garden.modal-area.button-cancel")}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default EditGardenPage;
