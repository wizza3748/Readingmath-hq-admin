'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGroupBuyStore, mapGroupBuyData } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    MessageCircle,
    Star,
    AlertCircle,
    Info,
    CalendarDays,
    Gift,
    ShoppingBag,
    ChevronRight,
    Sparkles,
    MousePointer2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom';

// --- Components ---

/**
 * 카운트다운 컴포넌트 (플로팅 CTA 내부용)
 * 디자인: 네온 글로우 스타일, 완전 한글화
 */
function CountdownTimer({ targetDate, onEnded }: { targetDate: string, onEnded: () => void }) {
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

    useEffect(() => {
        const calculate = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();

            if (isNaN(target)) {
                setTimeLeft(null);
                return;
            }

            const distance = target - now;

            if (distance <= 0) {
                setTimeLeft(null);
                onEnded();
                return;
            }

            setTimeLeft({
                d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((distance % (1000 * 60)) / 1000)
            });
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onEnded]);

    if (!timeLeft) return null;

    const { d, h, m, s } = timeLeft;

    return (
        <div className="flex items-center gap-3 font-black">
            <div className="hidden md:flex items-center gap-2 text-orange-400 opacity-90 animate-pulse">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-black tracking-tight">남은 시간</span>
            </div>
            <div className="flex items-center gap-1.5 text-2xl md:text-4xl tracking-tighter tabular-nums text-white">
                {d > 0 && (
                    <>
                        <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{d}</span>
                        <span className="text-sm text-slate-400 font-black ml-0.5 mr-2 mt-1">일</span>
                    </>
                )}
                <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{String(h).padStart(2, '0')}</span>
                <span className="text-orange-500/60 -mt-1 mx-0.5">:</span>
                <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">{String(m).padStart(2, '0')}</span>
                <span className="text-orange-500/60 -mt-1 mx-0.5">:</span>
                <span className="drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] text-orange-500 animate-pulse">{String(s).padStart(2, '0')}</span>
            </div>
        </div>
    );
}

/**
 * 홍보 이미지 컴포넌트
 * 디자인: 메탈릭 프레임 및 입체 효과
 */
function PromotionImage({ subject }: { subject: string }) {
    const imgRef = React.useRef<HTMLImageElement>(null);

    const onUpdate = React.useCallback(({ x, y, scale }: { x: number, y: number, scale: number }) => {
        if (imgRef.current) {
            const value = make3dTransformValue({ x, y, scale });
            imgRef.current.style.setProperty('transform', value);
        }
    }, []);

    const GH_BASE = "https://raw.githubusercontent.com/wizza3748/Readingmath-hq-admin/refs/heads/main/docs/groupbuy";
    const imgSrc = subject === '리딩과학'
        ? `${GH_BASE}/groupbuy_science_detail.png`
        : `${GH_BASE}/groupbuy_math_detail.png`;

    return (
        <div className="w-full bg-[#020412] overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_50px_120px_rgba(0,0,0,0.9)] relative group transition-all duration-700 hover:border-blue-500/30">
            {/* Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-white/5 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <QuickPinchZoom onUpdate={onUpdate} enforceBoundsDuringZoom={true} tapZoomFactor={0}>
                <div className="w-full">
                    <img
                        ref={imgRef}
                        src={imgSrc}
                        alt={`${subject} 상세`}
                        className="w-full h-auto block transform-gpu will-change-transform"
                        draggable={false}
                    />
                </div>
            </QuickPinchZoom>

            <div className="absolute bottom-10 right-10 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 z-20 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0 shadow-2xl">
                <MousePointer2 className="w-5 h-5 text-blue-400 animate-bounce" />
                <span className="text-xs font-black text-white tracking-tight">확대해서 보기</span>
            </div>
        </div>
    );
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
        // ISO 형식(T 또는 : 포함)이 아닌 경우에만 마침표(.)를 하이픈(-)으로 변환
        const normalized = (dateStr.includes('T') || dateStr.includes(':')) ? dateStr : dateStr.replace(/\./g, '-');
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return "-";
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
        return "-";
    }
};

export default function GroupBuyPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { groupBuys } = useGroupBuyStore();
    const [activeTab, setActiveTab] = useState<'리딩수학' | '리딩과학'>('리딩수학');
    const [isTimeEnded, setIsTimeEnded] = useState(false);

    const rawData = useMemo(() => groupBuys.find(item => item.id === id), [groupBuys, id]);

    // [RM-226] 데이터 정규화 및 고정 데이터 주입
    const data = useMemo(() => {
        if (!rawData) return null;

        const mapped = mapGroupBuyData(rawData);

        if (id === 'GB-ONGOING-001') {
            return {
                ...mapped,
                contractor: "진순이",
                subject: "리딩수학과학",
                // paymentStartAt, paymentEndAt 등 기간 정보는 mapped(store) 값을 그대로 사용하도록 하드코딩 제거
                benefitFreeDays: 5,
                diagProvided: true,
                diagRange: 'semester' as const,
                guideText: mapped.guideText || `기존 리딩수학과학 회원들인 경우 “기존 회원 참여하기”를 선택하세요!
신규 회원 및 기존 회원 모두 공동구매 기간 동안 할인된 금액으로 이용권 결제가 가능합니다.
공동구매 이벤트 기간은 사정에 따라 변경될 수 있습니다.`,
                promo_content_enabled: rawData.promo_content_enabled !== undefined ? rawData.promo_content_enabled : false
            };
        }
        return {
            ...mapped,
            promo_content_enabled: rawData.promo_content_enabled !== undefined ? rawData.promo_content_enabled : false
        };
    }, [rawData, id]);

    const isEndedStatus = data?.status === '종료';
    const showPromoContent = !isEndedStatus && data?.promo_content_enabled; // 진행전 또는 진행중 AND ON
    const showCTA = data && !isEndedStatus && !isTimeEnded;

    const handleCTAClick = (label: string) => {
        alert(`[미리보기 안내]\n'${label}' 행동을 수행했습니다.\n관리자 미리보기 화면에서는 실제 가입/결제가 이어지지 않습니다.`);
    };

    const [stars, setStars] = useState<{ width: string, height: string, top: string, left: string, delay: string, duration: string }[]>([]);

    useEffect(() => {
        // Hydration 에러 방지를 위해 클라이언트 사이드에서만 별 데이터 생성
        const newStars = [...Array(50)].map(() => ({
            width: Math.random() * 2 + 'px',
            height: Math.random() * 2 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            delay: Math.random() * 5 + 's',
            duration: (Math.random() * 3 + 2) + 's'
        }));
        setStars(newStars);
    }, []);

    const isSamePeriod = useMemo(() => {
        if (!data) return true;
        const pS = data.paymentStartAt?.split('T')[0] || '';
        const pE = data.paymentEndAt?.split('T')[0] || '';
        const jS = data.joinStartAt?.split('T')[0] || '';
        const jE = data.joinEndAt?.split('T')[0] || '';
        return pS === jS && pE === jE;
    }, [data?.paymentStartAt, data?.paymentEndAt, data?.joinStartAt, data?.joinEndAt]);

    if (!data) return <div className="min-h-screen bg-[#020412] flex items-center justify-center text-white">데이터를 찾을 수 없습니다.</div>;

    const subjectPrefix = data.subject || "리딩수학";
    const fullTitle = data.contractor === '본사' ? `${subjectPrefix} 공동구매 이벤트!` : `${subjectPrefix} X ${data.contractor} 공동구매 이벤트!`;

    return (
        <div className="min-h-screen bg-[#020412] text-white font-sans selection:bg-orange-500/40 overflow-x-hidden pb-80">
            {/* --- Advanced Deep Space Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Mesh Gradient / Nebula Layers */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] h-[1200px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(15,23,42,0.6)_0%,rgba(3,7,18,0.8)_60%,transparent_100%)] blur-[120px]" />
                <div className="absolute top-[10%] right-[-15%] w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[180px] animate-pulse" />
                <div className="absolute top-[40%] left-[-15%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[180px]" />
                <div className="absolute bottom-0 right-[10%] w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[180px]" />

                {/* Star Field Effect */}
                <div className="stars-container absolute inset-0 opacity-40">
                    {stars.map((star, i) => (
                        <div
                            key={i}
                            className="star absolute bg-white rounded-full animate-twinkle"
                            style={{
                                width: star.width,
                                height: star.height,
                                top: star.top,
                                left: star.left,
                                animationDelay: star.delay,
                                animationDuration: star.duration
                            }}
                        />
                    ))}
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            <div className="relative z-10 w-full max-w-[1400px] mx-auto flex flex-col items-center px-8">

                {/* Header Section */}
                <header className="w-full pt-40 pb-32 text-center space-y-12">
                    <div className="animate-in fade-in slide-in-from-top-6 duration-1000">
                        {data.subtitle && (
                            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-orange-500/30 bg-orange-500/15 shadow-[0_0_40px_rgba(249,115,22,0.25)] backdrop-blur-2xl">
                                <Sparkles className="w-5 h-5 text-orange-400" />
                                <span className="text-xl md:text-2xl font-black text-orange-400 tracking-tight">{data.subtitle}</span>
                            </div>
                        )}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black leading-[1.05] tracking-tighter break-keep max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                        <span className="bg-gradient-to-b from-white via-white to-white/50 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {fullTitle}
                        </span>
                    </h1>
                </header>

                {/* Main Content */}
                <main className="w-full max-w-[1000px] space-y-36">

                    {/* Feature Highlight Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                        {/* Period Card */}
                        <div className="md:col-span-2 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-orange-600/30 rounded-[3.5rem] blur-xl opacity-80 group-hover:opacity-100 transition duration-1000"></div>
                            <div className="relative flex flex-col items-center justify-center bg-[#0B1224]/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-12 md:p-16 shadow-3xl overflow-hidden">
                                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="space-y-8 text-center md:text-left flex-1">
                                        {isSamePeriod ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-center md:justify-start gap-3.5 text-blue-400">
                                                    <CalendarDays className="w-6 h-6 animate-pulse" />
                                                    <span className="text-lg md:text-xl font-black tracking-tight uppercase">공구 기간 (가입 및 결제)</span>
                                                </div>
                                                <p className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-2xl">
                                                    {formatDate(data.paymentStartAt)} <span className="text-white/20 mx-3 font-normal">~</span> {formatDate(data.paymentEndAt)}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center md:justify-start gap-3.5 text-blue-400">
                                                        <CalendarDays className="w-6 h-6" />
                                                        <span className="text-sm md:text-base font-black tracking-tight uppercase">결제 가능 기간</span>
                                                    </div>
                                                    <p className="text-3xl md:text-5xl font-black tracking-tight text-white/90">
                                                        {formatDate(data.paymentStartAt)} <span className="text-white/20 mx-2 font-normal">~</span> {formatDate(data.paymentEndAt)}
                                                    </p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-center md:justify-start gap-3.5 text-purple-400">
                                                        <CalendarDays className="w-6 h-6" />
                                                        <span className="text-sm md:text-base font-black tracking-tight uppercase">가입 가능 기간</span>
                                                    </div>
                                                    <p className="text-3xl md:text-5xl font-black tracking-tight text-white/90">
                                                        {formatDate(data.joinStartAt)} <span className="text-white/20 mx-2 font-normal">~</span> {formatDate(data.joinEndAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[2.5rem] flex flex-col items-center gap-3 shadow-inner min-w-[200px]">
                                        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 flex items-center justify-center shadow-lg">
                                            <CheckCircle2 className="w-9 h-9 text-blue-400" />
                                        </div>
                                        <div className="text-base font-black text-blue-400">이벤트 한정 혜택</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gift Card */}
                        <div className="relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="bg-[#0B1224]/80 backdrop-blur-2xl border border-white/10 p-14 rounded-[3rem] flex flex-col items-center text-center gap-8 shadow-3xl hover:-translate-y-3 transition-all duration-500 hover:border-orange-500/30">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-40 animate-pulse" />
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.5)] border border-orange-300/20">
                                        <Gift className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-lg md:text-xl font-black text-white/50 tracking-tight">무료 체험 혜택</p>
                                    <p className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl">{data.benefitFreeDays || 0}일 즉시 지급</p>
                                </div>
                            </div>
                        </div>

                        {/* Diag Card */}
                        <div className="relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="bg-[#0B1224]/80 backdrop-blur-2xl border border-white/10 p-14 rounded-[3rem] flex flex-col items-center text-center gap-8 shadow-3xl hover:-translate-y-3 transition-all duration-500 hover:border-blue-500/30">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 animate-pulse" />
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.5)] border border-blue-300/20">
                                        <AlertCircle className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-lg md:text-xl font-black text-white/50 tracking-tight">진단평가 혜택</p>
                                    <p className="text-3xl md:text-4xl font-black text-white px-2 leading-tight">
                                        {data.diagProvided
                                            ? <span className="text-white">학습 진단 결과 <span className="text-blue-400 shadow-blue-400 drop-shadow-md">제공</span></span>
                                            : '미제공 항목'}
                                    </p>
                                    <p className="text-lg font-black text-blue-400/80 mt-1">
                                        {data.diagProvided && (
                                            data.diagRange === 'semester' ? '(학생 적용 이전 학기)' :
                                                data.diagRange === 'all' ? '(전체 학기)' :
                                                    data.diagRange === 'count' ? `(선택 횟수: ${data.diagCount}회 응시 가능)` :
                                                        data.diagRange === 'grade' ? '(학생 적용 학년)' : ''
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Guide Text Section */}
                    <section className="relative">
                        <div className="absolute -top-10 -left-10 opacity-30">
                            <MessageCircle className="w-16 h-16 text-blue-500 animate-bounce" />
                        </div>
                        <div className="bg-[#0B1224]/60 border border-white/10 rounded-[4rem] p-16 relative overflow-hidden group shadow-3xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-64 -mt-64" />
                            <div className="relative leading-[1.8] text-slate-300 font-bold whitespace-pre-wrap text-lg md:text-xl tracking-tight text-center md:text-left">
                                {data.guideText || "안내 사항이 없습니다."}
                            </div>
                        </div>
                    </section>

                    {/* Image Showcase Section */}
                    {showPromoContent && (
                        <section className="space-y-16 pb-32">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-2xl">상품 상세 정보</h2>
                                <div className="w-20 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                            </div>

                            {data.subject === '리딩수학과학' && (
                                <div className="space-y-4">
                                    <p className="text-center text-xs text-white/40 font-bold tracking-widest uppercase">본 과목별 규칙은 홍보 콘텐츠 설정 = ON 인 경우에만 적용</p>
                                    <div className="bg-white/5 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-white/10 flex gap-3 max-w-md mx-auto shadow-4xl mb-12">
                                        {(['리딩수학', '리딩과학'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={cn(
                                                    "relative flex-1 py-5 px-8 rounded-[1.8rem] text-sm md:text-base font-black transition-all overflow-hidden group",
                                                    activeTab === tab
                                                        ? "text-white shadow-[0_15px_40px_rgba(249,115,22,0.4)]"
                                                        : "text-slate-500 hover:text-slate-200"
                                                )}
                                            >
                                                {activeTab === tab && (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 z-0 scale-100 transition-transform duration-700" />
                                                )}
                                                <span className="relative z-10">{tab}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="animate-in fade-in slide-in-from-bottom-20 duration-1000">
                                <PromotionImage subject={data.subject === '리딩수학과학' ? activeTab : (data.subject as string)} />
                            </div>
                        </section>
                    )}
                </main>
            </div>

            {/* --- High-End Premium Floating CTA --- */}
            {showCTA && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] px-8 pb-16 pt-24 flex flex-col items-center pointer-events-none bg-gradient-to-t from-[#020412] via-[#020412]/98 to-transparent">
                    <div className="w-full max-w-[720px] flex flex-col items-center gap-8 pointer-events-auto">

                        {/* Status Label + Timer */}
                        <div className="bg-[#0B1224]/90 backdrop-blur-3xl px-12 py-5 rounded-full border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex items-center gap-10 hover:border-orange-500/30 transition-all duration-700">
                            <div className="flex items-center gap-3 border-r border-white/10 pr-10">
                                <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_20px_rgba(249,115,22,1)]" />
                                <span className="text-sm font-black text-white tracking-tight uppercase">이벤트 종료까지</span>
                            </div>
                            <CountdownTimer targetDate={data.paymentEndAt!} onEnded={() => setIsTimeEnded(true)} />
                        </div>

                        {/* Order Buttons */}
                        <div className="flex w-full gap-5">
                            <Button
                                variant="outline"
                                onClick={() => handleCTAClick('기존 회원')}
                                className="flex-1 h-20 md:h-24 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border-white/20 text-white font-black text-lg md:text-xl hover:bg-white/10 shadow-4xl group relative overflow-hidden transition-all border-b-4 border-b-white/5 active:border-b-0 active:translate-y-1"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200" />
                                기존 회원 참여
                            </Button>
                            <Button
                                onClick={() => handleCTAClick('신규 회원')}
                                className="flex-[1.6] h-20 md:h-24 rounded-[2.5rem] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 text-white font-black text-xl md:text-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-[0_25px_60px_rgba(249,115,22,0.5)] group overflow-hidden border-b-4 border-b-orange-800/50 active:border-b-0 active:translate-y-1"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_75%)] opacity-30 group-hover:opacity-50 transition-opacity" />
                                <div className="flex items-center justify-center gap-3">
                                    <span>신규 회원 가입</span>
                                    <ChevronRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-500" />
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://webfontworld.github.io/pretendard/Pretendard.css');
                
                body {
                    font-family: 'Pretendard', sans-serif;
                    background-color: #020412;
                    -webkit-font-smoothing: antialiased;
                    color: white;
                }
                .break-keep { word-break: keep-all; }

                /* Custom Animations */
                @keyframes twinkle {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
                .animate-twinkle {
                  animation: twinkle linear infinite;
                }

                .shadow-3xl {
                  box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.7);
                }
                .shadow-4xl {
                  box-shadow: 0 50px 120px -30px rgba(0, 0, 0, 0.9);
                }
            `}</style>
        </div>
    );
}
