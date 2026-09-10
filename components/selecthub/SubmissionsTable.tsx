import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Submission = Record<string, unknown>;

type SubmissionsTableProps = {
  submissions: Submission[];
  emptyMessage?: string;
};

function value(input: unknown) {
  if (input === null || input === undefined) return "-";
  const text = String(input).trim();
  return text.length ? text : "-";
}

function getLeadValue(lead: unknown, key: string) {
  if (!lead || typeof lead !== "object" || Array.isArray(lead)) return "-";
  return value((lead as Record<string, unknown>)[key]);
}

export function SubmissionsTable({ submissions, emptyMessage = "No submissions match this view." }: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return <p className="dashboard-muted">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Campaign</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Scorecard ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => {
          const lead = submission.lead;
          const fullName = `${getLeadValue(lead, "first_name")} ${getLeadValue(lead, "last_name")}`.trim();
          const location = ["city", "state", "country"]
            .map((key) => getLeadValue(lead, key))
            .filter((item) => item !== "-")
            .join(", ");
          return (
            <TableRow key={String(submission.id)}>
              <TableCell>{value(submission.created_at) !== "-" ? new Date(String(submission.created_at)).toLocaleString() : "-"}</TableCell>
              <TableCell>
                <strong className={`status-${String(submission.status || "pending")}`}>
                  {value(submission.status).toUpperCase()}
                </strong>
              </TableCell>
              <TableCell>{value(submission.campaign_slug)}</TableCell>
              <TableCell>{fullName === "- -" ? "-" : fullName}</TableCell>
              <TableCell>{getLeadValue(lead, "email")}</TableCell>
              <TableCell>{getLeadValue(lead, "company_name")}</TableCell>
              <TableCell>{getLeadValue(lead, "phone_number")}</TableCell>
              <TableCell>{location || "-"}</TableCell>
              <TableCell>{value(submission.scorecard_id)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
