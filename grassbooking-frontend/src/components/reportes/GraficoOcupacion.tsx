import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DatoOcupacion } from '../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  datos: DatoOcupacion[];
}

export const GraficoOcupacion = ({ datos }: Props) => {
  const dataFormateada = datos.map((d) => ({
    ...d,
    fechaCorta: format(parseISO(d.fecha), 'dd/MM', { locale: es }),
    porcentaje: d.porcentajeOcupacion,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dataFormateada} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeef" vertical={false} />
        <XAxis dataKey="fechaCorta" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#d7dade' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Ocupación']}
          labelFormatter={(label) => `Fecha: ${label}`}
          contentStyle={{ borderRadius: 8, borderColor: '#d7dade', fontSize: 13 }}
        />
        <Bar dataKey="porcentaje" radius={[3, 3, 0, 0]}>
          {dataFormateada.map((entry, index) => (
            <Cell key={index} fill="#17181b" fillOpacity={0.15 + Math.min(entry.porcentaje, 100) * 0.0085} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
