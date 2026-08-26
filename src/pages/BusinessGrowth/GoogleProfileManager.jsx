import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiEye,
  FiGlobe,
  FiImage,
  FiMapPin,
  FiMessageCircle,
  FiNavigation,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiStar,
} from "react-icons/fi";
import Button from "../../components/Common/Button";
import Card from "../../components/Common/Card";
import { googleProfileDateRanges, googleProfileMock, googleProfileNav } from "../../constants/googleProfileData";

const toneClasses = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
};

const metricIcons = {
  views: FiEye,
  rating: FiStar,
  reviews: FiMessageCircle,
  calls: FiPhone,
  directions: FiNavigation,
};

function StateSwitch({ status, setStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 text-xs">
      {["disconnected", "connected", "loading", "empty", "error"].map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setStatus(item)}
          className={`rounded-md px-2.5 py-1.5 font-semibold capitalize ${status === item ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function PageHeader({ status, setStatus, connected }) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800">Google Profile Manager</h1>
          {connected && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Demo connected</span>}
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage local visibility, reviews, photos, and profile details from one place.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StateSwitch status={status} setStatus={setStatus} />
        <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
          <FiRefreshCw className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
          <FiSettings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function DisconnectedState({ setStatus }) {
  return (
    <div className="grid min-h-[calc(100vh-184px)] place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-4xl overflow-hidden shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FiGlobe className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Connect your Google Business Profile</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Connect Google later to monitor profile performance, respond to customer reviews, manage photos, and keep business details ready for discovery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Connect Google</Button>
              <Button className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Use Another Google Account</Button>
              <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Create Business Profile
              </button>
            </div>
            <button type="button" onClick={() => setStatus("connected")} className="mt-5 text-xs font-semibold text-slate-500 hover:text-slate-700">
              View demo connected dashboard
            </button>
          </div>
          <div className="border-t border-slate-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Local presence kit</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">UI only</span>
              </div>
              {["Search insights", "Review replies", "Photo updates", "Business details"].map((item) => (
                <div key={item} className="mb-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
                  <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusState({ type, setStatus }) {
  const content = {
    loading: ["Preparing Google Profile Manager", "This loading surface is ready for future Google API sync."],
    empty: ["No business profile found", "Create or connect a Google Business Profile to begin monitoring performance."],
    error: ["Google profile unavailable", "Future API errors will appear here with retry actions."],
  }[type];

  return (
    <div className="grid min-h-[calc(100vh-184px)] place-items-center bg-slate-50 p-4">
      <Card className="max-w-lg p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
          <FiAlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{content[0]}</h2>
        <p className="mt-2 text-sm text-slate-500">{content[1]}</p>
        <Button onClick={() => setStatus("connected")} className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
          View Demo Dashboard
        </Button>
      </Card>
    </div>
  );
}

function ProfileBar({ profile, dateRange, setDateRange }) {
  return (
    <section className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-bold text-slate-800">{profile.name}</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{profile.category}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {profile.status}</span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><FiMapPin className="h-4 w-4" /> {profile.location}</p>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
        Range
        <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400">
          {googleProfileDateRanges.map((range) => <option key={range}>{range}</option>)}
        </select>
      </label>
    </section>
  );
}

function SectionNav({ active, setActive }) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
      {googleProfileNav.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActive(item.id)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${active === item.id ? "bg-[#1A1F71] text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function MetricGrid({ metrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.id];
        return (
          <Card key={metric.id} className="p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
              </div>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClasses[metric.tone]}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">{metric.trend}</p>
          </Card>
        );
      })}
    </div>
  );
}

function PerformanceCard({ data }) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Google Presence Performance</h3>
        <span className="text-xs font-semibold text-slate-400">Chart-ready placeholder</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="relative h-64 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="absolute inset-x-4 top-8 border-t border-slate-200" />
          <div className="absolute inset-x-4 top-24 border-t border-slate-200" />
          <div className="absolute inset-x-4 top-40 border-t border-slate-200" />
          <div className="absolute inset-x-4 bottom-10 border-t border-blue-400" />
          <div className="relative flex h-full items-end justify-between gap-2 pt-4">
            {data.labels.map((label, index) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <div className={`w-full max-w-10 rounded-t bg-blue-500/70 ${data.barHeights[index]}`} />
                <span className="text-[11px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-3">
          {data.series.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-white p-3">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-full rounded-full bg-blue-500 ${item.widthClass}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ReputationCard({ reputation }) {
  return (
    <Card className="p-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-800">Reputation Overview</h3>
      <div className="mt-4 grid gap-5 md:grid-cols-[160px_1fr]">
        <div className="rounded-xl bg-amber-50 p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{reputation.averageRating.toFixed(1)}</p>
          <p className="mt-1 text-xs font-semibold uppercase text-amber-600">Average Rating</p>
          <p className="mt-2 text-sm text-slate-500">{reputation.totalReviews} reviews</p>
        </div>
        <div className="space-y-2">
          {reputation.distribution.map((item) => (
            <div key={item.stars} className="grid grid-cols-[64px_1fr_28px] items-center gap-3 text-sm">
              <span className="font-medium text-slate-600">{item.stars} stars</span>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-full rounded-full bg-amber-400 ${item.widthClass}`} />
              </div>
              <span className="text-right font-semibold text-slate-700">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Overview({ data }) {
  return (
    <div className="space-y-3">
      <MetricGrid metrics={data.metrics} />
      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
        <PerformanceCard data={data.performance} />
        <ReputationCard reputation={data.reputation} />
      </div>
    </div>
  );
}

function Reviews({ reviews }) {
  const [replyId, setReplyId] = useState("");
  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">Customer Reviews</h3>
        <span className="text-sm font-semibold text-slate-500">{reviews.length} demo reviews</span>
      </div>
      {reviews.length ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{review.reviewer[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{review.reviewer}</p>
                    <p className="text-xs text-slate-500">{review.date}</p>
                  </div>
                </div>
                <div className="flex text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <FiStar key={index} className="h-4 w-4 fill-current" />)}</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{review.text}</p>
              {replyId === review.id ? (
                <div className="mt-3 space-y-2">
                  <textarea className="h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" placeholder="Write a reply for later Google API publishing..." />
                  <div className="flex gap-2">
                    <Button className="bg-blue-600 px-4 py-2 text-white">Save Draft</Button>
                    <Button onClick={() => setReplyId("")} className="border border-slate-200 bg-white px-4 py-2 text-slate-600">Cancel</Button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setReplyId(review.id)} className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700">Reply</button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No reviews yet" text="Reviews from Google will appear here after connection." />
      )}
    </Card>
  );
}

function Photos({ photos }) {
  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Photo Management</h3>
          <p className="text-sm text-slate-500">{photos.length} photo placeholders ready for sync.</p>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-700"><FiPlus /> Add Photo</Button>
      </div>
      {photos.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="rounded-lg border border-slate-100 p-3">
              <div className="grid aspect-[4/3] place-items-center rounded-lg bg-slate-100 text-slate-400">
                <FiImage className="h-8 w-8" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{photo.title}</p>
                  <p className="text-xs text-slate-500">{photo.type}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{photo.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel title="No photos yet" text="Add local placeholders now; Google upload can be connected later." />
      )}
    </Card>
  );
}

function ReviewQr({ qr }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="p-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Smart Review QR</h3>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-slate-600">Business Name<input value={qr.businessName} readOnly className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none" /></label>
          <label className="text-sm font-semibold text-slate-600">Review Link<input value={qr.reviewLink} readOnly className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none" /></label>
          <div className="flex flex-wrap gap-2">
            <Button className="border border-slate-200 bg-white text-slate-700"><FiCopy /> Copy Link</Button>
            <Button className="border border-slate-200 bg-white text-slate-700"><FiDownload /> Download QR</Button>
          </div>
        </div>
      </Card>
      <Card className="grid place-items-center p-5 text-center shadow-sm">
        <div className="grid h-44 w-44 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
          <div className="grid h-28 w-28 grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, index) => <span key={index} className={`rounded-sm ${index % 3 === 0 ? "bg-slate-900" : "bg-slate-300"}`} />)}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">QR preview placeholder</p>
      </Card>
    </div>
  );
}

function BusinessDetails({ details, profile }) {
  const [form, setForm] = useState(details);
  const fields = [
    ["businessName", "Business Name"],
    ["primaryCategory", "Primary Category"],
    ["phoneNumber", "Phone Number"],
    ["website", "Website"],
    ["address", "Address"],
    ["businessHours", "Business Hours"],
    ["description", "Business Description"],
  ];
  return (
    <Card className="p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-800">Business Details</h3>
        <div className="min-w-[180px]">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500"><span>Profile completeness</span><span>{profile.completeness}%</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full bg-emerald-500 ${profile.completenessClass}`} /></div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className={key === "description" ? "md:col-span-2" : ""}>
            <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
            {key === "description" ? (
              <textarea value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            ) : (
              <input value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400" />
            )}
          </label>
        ))}
      </div>
      <Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700">Save Demo Details</Button>
    </Card>
  );
}

function EmptyPanel({ title, text }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div>
        <FiCamera className="mx-auto h-8 w-8 text-slate-300" />
        <h4 className="mt-3 font-bold text-slate-800">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function ConnectedDashboard({ data }) {
  const [active, setActive] = useState("overview");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const activeView = useMemo(() => {
    if (active === "reviews") return <Reviews reviews={data.reviews} />;
    if (active === "photos") return <Photos photos={data.photos} />;
    if (active === "qr") return <ReviewQr qr={data.qr} />;
    if (active === "details") return <BusinessDetails details={data.businessDetails} profile={data.profile} />;
    return <Overview data={data} />;
  }, [active, data]);

  return (
    <>
      <ProfileBar profile={data.profile} dateRange={dateRange} setDateRange={setDateRange} />
      <SectionNav active={active} setActive={setActive} />
      <main className="space-y-3 bg-slate-100 p-3">{activeView}</main>
    </>
  );
}

function GoogleProfileManager() {
  const [status, setStatus] = useState("disconnected");
  const connected = status === "connected";

  return (
    <div className="min-h-full bg-slate-100">
      <PageHeader status={status} setStatus={setStatus} connected={connected} />
      {status === "disconnected" && <DisconnectedState setStatus={setStatus} />}
      {["loading", "empty", "error"].includes(status) && <StatusState type={status} setStatus={setStatus} />}
      {connected && <ConnectedDashboard data={googleProfileMock} />}
    </div>
  );
}

export default GoogleProfileManager;
