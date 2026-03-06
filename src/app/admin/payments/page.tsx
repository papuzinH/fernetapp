import { getPlayerDebtSummary } from "@/lib/supabase/queries/payments";
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
import { DollarSign } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const debts = await getPlayerDebtSummary();

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.total_debt), 0);
  const totalPaid = debts.reduce((sum, d) => sum + Number(d.total_paid), 0);
  const playersWithDebt = debts.filter((d) => Number(d.total_debt) > 0).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Estado de Cuenta</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalPaid.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jugadores con Deuda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playersWithDebt}</div>
          </CardContent>
        </Card>
      </div>

      {/* Debt table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Deudas por Jugador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-center">Partidos Pend.</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((d) => {
                const debt = Number(d.total_debt);
                const paid = Number(d.total_paid);
                return (
                  <TableRow key={d.player_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/players/${d.player_id}`}
                        className="hover:underline"
                      >
                        {d.nickname}
                        {!d.is_active && (
                          <span className="text-muted-foreground text-xs ml-1">
                            (inactivo)
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {d.pending_matches}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={debt > 0 ? "text-red-600 font-semibold" : ""}>
                        ${debt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${paid.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {debt === 0 ? (
                        <Badge variant="secondary">Al día</Badge>
                      ) : (
                        <Badge variant="destructive">Debe</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {debts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay pagos registrados aún. Los pagos se generan automáticamente
                    al completar un partido con precio de cancha.
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
