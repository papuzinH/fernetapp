import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMatchPayments } from "@/lib/supabase/queries/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaymentToggleButton } from "@/app/admin/payments/payment-toggle-button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MatchPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: matchId } = await params;
  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match } = await supabase
    .from("matches")
    .select("*, tournaments(name)")
    .eq("id", matchId)
    .single() as { data: any };

  if (!match) notFound();

  const payments = await getMatchPayments(matchId);

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/matches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            Pagos: vs {match.opponent} ({(match as any).tournaments?.name})
          </h2>
          <p className="text-muted-foreground text-sm">
            {match.date} &middot; Cancha: $
            {Number(match.pitch_price ?? 0).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}{" "}
            &middot; Costo por jugador: $
            {payments.length > 0
              ? Number(payments[0].amount).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Cancha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ${totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pagaron
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {paidCount} / {payments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nickname}</TableCell>
                  <TableCell className="text-right">
                    ${Number(p.amount).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.status === "paid" ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Pagó
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <PaymentToggleButton
                      paymentId={p.id}
                      currentStatus={p.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay pagos para este partido. Asegurate de que tenga precio de cancha
                    y jugadores registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
