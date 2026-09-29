/**
 * Punto único de importación de los componentes de interfaz.
 *
 * Son envoltorios finos sobre Ant Design que fijan el aspecto y la API en
 * español de SERVIS. Para los componentes cuya API de Ant Design ya encaja
 * (Modal, Select, Table, Dropdown, Popover, Checkbox, Switch, Descriptions…)
 * las pantallas importan directamente desde `antd`.
 */

export { Avatar, AvatarUsuario } from './Avatar';
export { Badge, RoleBadge, StatusBadge, type TonoBadge } from './Badge';
export { BarChart, type BarraDato } from './BarChart';
export { Breadcrumb, type Miga } from './Breadcrumb';
export {
  Button,
  ButtonLink,
  type ButtonProps,
  type TamanoBoton,
  type VarianteBoton,
} from './Button';
export { Card, NoteBlock, PageHeader, SectionHeader, Sobretitulo } from './Card';
export { ListaDatos, type Dato } from './Datos';
export {
  EmptyState,
  InlineNotification,
  Loading,
  Progress,
  Separator,
  type TonoNotificacion,
} from './Feedback';
export { DateInput, Field, FieldHint, FieldLabel, Input, Textarea } from './Field';
export { FileChip, UploadZone } from './Files';
export { CampoBusqueda, SelectorFiltro } from './Filtros';
export { Icono, type NombreIcono } from './Icons';
export { Tooltip } from './Overlays';
export { ProveedorUI } from './Proveedor';
export { StatCard } from './StatCard';
export { Steps } from './Steps';
export { Timeline, type EstadoPunto, type HitoTimeline } from './Timeline';
export { useToast } from './Toast';
