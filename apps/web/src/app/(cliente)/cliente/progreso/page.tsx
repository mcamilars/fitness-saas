"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import { useMiClienteIdResolved } from "@/lib/auth/use-mi-cliente-id-resolved";
import type { ProgresoCliente, ProgresoDato, VistaProgreso } from "@/lib/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function fetchProgreso(clienteId: string, vista: VistaProgreso) {
  const response = await apiFetch<{ progreso: ProgresoCliente } | ProgresoCliente | { data: { progreso: ProgresoCliente } | ProgresoCliente }>(`/api/clientes/${clienteId}/progreso?vista=${vista}`);
  const data = unwrapData(response);
  return "progreso" in data ? data.progreso : data;
}

function datosDesdeProgreso(progreso: ProgresoCliente, vista: VistaProgreso): ProgresoDato[] {
  if (progreso.datos?.length) {return progreso.datos;}

  if (progreso.periodos?.length) {
    return progreso.periodos.map((periodo) => ({
      etiqueta: periodo.etiqueta,
      entrenamientos: periodo.totalSesiones,
      volumenTotal: periodo.duracionTotalMin,
      pesoPromedio: periodo.totalEjercicios,
    }));
  }

  return [{
    etiqueta: progreso.vista ?? vista,
    entrenamientos: progreso.sesiones ?? progreso.totalSesiones ?? 0,
    volumenTotal: progreso.volumenTotal ?? 0,
    pesoPromedio: progreso.pesoPromedio,
  }];
}

export default function ProgresoPage() {
  const { clienteId: miClienteId, isLoading: loadingCliente } = useMiClienteIdResolved();
  const [vista, setVista] = useState<VistaProgreso>("semanal");

  const { data: progreso, isLoading } = useQuery({
    queryKey: ["progreso", miClienteId, vista],
    queryFn: () => fetchProgreso(miClienteId!, vista),
    enabled: !!miClienteId,
  });

  const datos = progreso ? datosDesdeProgreso(progreso, vista) : [];
  const maxVolumen = Math.max(...datos.map((dato) => dato.volumenTotal), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1C1D]">Progreso</h1>
        <p className="text-sm text-[#616467]">Cambia la estrategia de análisis entre semanal, mensual y por plan.</p>
      </div>

      <Tabs value={vista} onValueChange={(value) => setVista(value as VistaProgreso)}>
        <TabsList>
          <TabsTrigger value="semanal">Semanal</TabsTrigger>
          <TabsTrigger value="mensual">Mensual</TabsTrigger>
          <TabsTrigger value="porPlan">Por plan</TabsTrigger>
        </TabsList>
      </Tabs>

      {loadingCliente || isLoading ? (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-3"><Skeleton className="h-12 w-full rounded-full" /><Skeleton className="h-12 w-full rounded-full" /></CardContent>
        </Card>
      ) : !progreso ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay progreso para mostrar</CardTitle>
            <CardDescription>Registra un entrenamiento para generar métricas.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-[#616467]">Sesiones</CardDescription>
                <CardTitle className="text-3xl font-bold text-[#1A1C1D]">
                  {progreso.sesiones ?? progreso.totalSesiones ?? datos.reduce((acc, dato) => acc + dato.entrenamientos, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-[#616467]">Volumen total</CardDescription>
                <CardTitle className="text-3xl font-bold text-[#1A1C1D]">
                  {progreso.volumenTotal ?? datos.reduce((acc, dato) => acc + dato.volumenTotal, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-[#616467]">Peso promedio</CardDescription>
                <CardTitle className="text-3xl font-bold text-[#1A1C1D]">
                  {progreso.pesoPromedio ?? "—"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#1A1C1D]">Detalle {vista}</CardTitle>
              <CardDescription>Resultado de la estrategia seleccionada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB]">
                    <TableHead className="text-[#616467]">Etiqueta</TableHead>
                    <TableHead className="text-[#616467]">Entrenamientos</TableHead>
                    <TableHead className="text-[#616467]">Duración total</TableHead>
                    <TableHead className="text-[#616467]">Ejercicios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((dato, index) => (
                    <TableRow key={`${dato.etiqueta || "sin-etiqueta"}-${index}`} className="border-[#E5E7EB]">
                      <TableCell className="font-medium text-[#1A1C1D]">{dato.etiqueta || "Sin etiqueta"}</TableCell>
                      <TableCell className="text-[#616467]">{dato.entrenamientos}</TableCell>
                      <TableCell className="text-[#616467]">{dato.volumenTotal}</TableCell>
                      <TableCell className="text-[#616467]">{dato.pesoPromedio ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-4">
                {datos.map((dato, index) => (
                  <div key={`${dato.etiqueta || "sin-etiqueta"}-${index}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#1A1C1D]">{dato.etiqueta || "Sin etiqueta"}</span>
                      <span className="font-semibold text-[#1A1C1D]">{dato.volumenTotal}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#ECF2F5]">
                      <div
                        className="h-2.5 rounded-full bg-[#C8E874]"
                        style={{ width: `${Math.max((dato.volumenTotal / maxVolumen) * 100, dato.volumenTotal > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
