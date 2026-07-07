import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
  Download,
  Search,
  Loader2,
  Copy
} from "lucide-react";
import { toast } from "sonner";

export default function Agents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [hasLineCode, setHasLineCode] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [exportCSVLoading, setExportCSVLoading] = useState(false);
  const [exportExcelLoading, setExportExcelLoading] = useState(false);

  // Import data on first load
  const importMutation = trpc.agents.importData.useMutation();
  useEffect(() => {
    importMutation.mutate();
  }, []);

  // Search agents
  const { data: searchResults, isLoading } = trpc.agents.search.useQuery(
    { searchTerm, typeFilter: typeFilter === "__all__" ? "" : typeFilter, hasLineCode: hasLineCode === "all" ? null : hasLineCode === "true", page, pageSize: 50 },
    { enabled: !importMutation.isPending }
  );
  const { data: stats } = trpc.agents.getStats.useQuery();

const {
  data: selectedAgentDetails,
  isLoading: isLoadingDetails
} = trpc.agents.getAgentWithLines.useQuery(
  {
    agentCode: selectedAgent?.agentCode || ""
  },
  {
    enabled:
      isDetailOpen &&
      !!selectedAgent?.agentCode
  }
);
  

  const agents = searchResults?.agents || [];
  const total = searchResults?.total || 0;
  const totalPages = searchResults?.totalPages || 1;
  const copyToClipboard = async (
  text: string | null | undefined,
  label: string
) => {
  if (!text) return;

  await navigator.clipboard.writeText(text);

  toast.success(`${label} copied`);
};

  const handleExportCSV = async () => {
    setExportCSVLoading(true);
    try {
      const utils = trpc.useUtils();
      const convertedHasLineCode = hasLineCode === "all" ? null : hasLineCode === "true";
      const convertedTypeFilter = typeFilter === "__all__" ? "" : typeFilter;
      const result = await utils.agents.exportCSV.fetch({ searchTerm, typeFilter: convertedTypeFilter, hasLineCode: convertedHasLineCode });
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(result.csv));
      element.setAttribute("download", `agents_${new Date().toISOString().split("T")[0]}.csv`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`Exported ${result.count} records to CSV`);
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setExportCSVLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportExcelLoading(true);
    try {
      const utils = trpc.useUtils();
      const convertedHasLineCode = hasLineCode === "all" ? null : hasLineCode === "true";
      const convertedTypeFilter = typeFilter === "__all__" ? "" : typeFilter;
      const result = await utils.agents.exportExcel.fetch({ searchTerm, typeFilter: convertedTypeFilter, hasLineCode: convertedHasLineCode });
      const binaryString = atob(result.buffer);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const element = document.createElement("a");
      element.setAttribute("href", url);
      element.setAttribute("download", `agents_${new Date().toISOString().split("T")[0]}.xlsx`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} records to Excel`);
    } catch (error) {
      toast.error("Failed to export Excel");
    } finally {
      setExportExcelLoading(false);
    }
  };

  const handleShowDetails = (agent: any) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Agent Master Listing</h1>
          
<p className="text-slate-600">
  Search, filter, and manage {" "}
  {stats?.totalAgents?.toLocaleString() || 0}
  {" "}agent records
</p>

        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalAgents.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Unique Agents</CardTitle>
              </CardHeader>
              <CardContent>
               <div className="text-3xl font-bold text-green-600">{stats.uniqueAgents.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Unique Lines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.uniqueLines.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search by company name, agent code, phone, line code, or line name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>

              <Select value={hasLineCode} onValueChange={(value: any) => {
                setHasLineCode(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Line Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="true">Has Line Code</SelectItem>
                  <SelectItem value="false">No Line Code</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setHasLineCode("all");
                  setPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={exportCSVLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportCSVLoading ? "Exporting..." : "Export CSV"}
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={exportExcelLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportExcelLoading ? "Exporting..." : "Export Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Agent Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Company Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Line Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Line Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No agents found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent: any) => (
                      <TableRow key={agent.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{agent.agentCode}</TableCell>
                        <TableCell className="text-slate-700">{agent.companyName}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{agent.lineCode || "—"}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{agent.lineName || "—"}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{agent.phone || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowDetails(agent)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setPage(page - 1)} />
                      </PaginationItem>
                    )}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={pageNum === page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => setPage(page + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent Details</DialogTitle>
              <DialogDescription>View all information for this agent</DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-900">Agent Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Agent Code</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-slate-900">{selectedAgentDetails?.agent?.agentCode}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedAgentDetails?.agent?.agentCode, "Agent Code")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Company Name</p>
                      <p className="font-medium text-slate-900 mt-1">{selectedAgentDetails?.agent?.companyName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Address</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-700">{selectedAgentDetails?.agent?.address || "—"}</p>
                        
{selectedAgentDetails?.agent?.address && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() =>
      copyToClipboard(
        selectedAgentDetails?.agent?.address,
        "Address"
      )
    }
  >
    <Copy className="w-4 h-4" />
  </Button>
)}

                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Phone</p>
                      <div className="flex items-center gap-2 mt-1">

<p>
  {selectedAgentDetails?.agent?.phone || "—"}
</p>
                    
{selectedAgentDetails?.agent?.phone && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() =>
      copyToClipboard(
        selectedAgentDetails?.agent?.phone,
        "Phone"
      )
    }
  >
    <Copy className="w-4 h-4" />
  </Button>
)}

                      </div>
                    </div>
                  </div>
                </div>

                {/* Represented Lines */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-900">Represented Lines ({selectedAgentDetails?.lines?.length || 0})</h3>
                  <div className="space-y-2">
                    {selectedAgentDetails?.lines?.map((line: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{line.lineCode}</p>
                          <p className="text-sm text-slate-600">{line.lineName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(line.lineCode, "Line Code")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Data source: Dubai Ports Authority 2026</p>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}


