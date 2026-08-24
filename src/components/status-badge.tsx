import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUSES,
  COMPANY_STATUSES,
  COVER_LETTER_STATUSES,
  findStatusMeta,
} from "@/lib/constants";

export function ApplicationStatusBadge({ status }: { status: string }) {
  const meta = findStatusMeta(APPLICATION_STATUSES, status);
  return <Badge color={meta?.color}>{meta?.label ?? status}</Badge>;
}

export function CompanyStatusBadge({ status }: { status: string }) {
  const meta = findStatusMeta(COMPANY_STATUSES, status);
  return <Badge color={meta?.color}>{meta?.label ?? status}</Badge>;
}

export function CoverLetterStatusBadge({ status }: { status: string }) {
  const meta = findStatusMeta(COVER_LETTER_STATUSES, status);
  return <Badge color={meta?.color}>{meta?.label ?? status}</Badge>;
}
