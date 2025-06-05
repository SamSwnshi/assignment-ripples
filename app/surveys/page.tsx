"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  PlusCircle,
  Search,
  SlidersHorizontal,
  ChevronDown,
  BarChart3,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { apiClient, Survey } from "@/app/lib/api"
import { useRouter } from "next/navigation"

export default function MySurveysPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const { toast } = useToast()
  const router = useRouter()

  // Use state to store surveys fetched from the API
  const [allSurveys, setAllSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [surveys, setSurveys] = useState(allSurveys)

  // Fetch surveys from the API on component mount
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getSurveys()
        console.log(response)
        if (response.success) {
          setAllSurveys(response.data)
        } else {
          setError(response.error || "Failed to fetch surveys")
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching surveys")
      } finally {
        setLoading(false)
      }
    }

    fetchSurveys()
  }, []) // Empty dependency array means this effect runs only once on mount

  // Filter surveys based on active tab
  useEffect(() => {
    if (activeTab === "all") {
      setSurveys(allSurveys)
    } else {
      // Ensure status matching is case-insensitive and handles potential null/undefined statuses
      setSurveys(allSurveys.filter((survey) => survey.status?.toLowerCase() === activeTab.toLowerCase()))
    }
  }, [activeTab, allSurveys])

  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(
    (survey) =>
      survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Also search by description
      (survey.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleSelectSurvey = (id: string) => {
    setSelectedSurveys((prev) => (prev.includes(id) ? prev.filter((surveyId) => surveyId !== id) : [...prev, id]))
  }

  const selectAllSurveys = () => {
    if (selectedSurveys.length === filteredSurveys.length) {
      setSelectedSurveys([])
    } else {
      setSelectedSurveys(filteredSurveys.map((survey) => survey.id))
    }
  }

  const deleteSurvey = (id: string) => {
    // This delete logic currently only updates local state. 
    // For a real application, you would call an API delete method here.
    const updatedSurveys = allSurveys.filter((survey) => survey.id !== id)
    setAllSurveys(updatedSurveys)
    setSelectedSurveys(selectedSurveys.filter((surveyId) => surveyId !== id))

    toast({
      title: "Survey Deleted",
      description: "The survey has been removed from the list.",
    })
  }

  const deleteSelectedSurveys = () => {
    // This delete logic currently only updates local state.
    // For a real application, you would call an API delete method here.
    const updatedSurveys = allSurveys.filter((survey) => !selectedSurveys.includes(survey.id))
    setAllSurveys(updatedSurveys)
    setSelectedSurveys([])

    toast({
      title: "Surveys Deleted",
      description: `${selectedSurveys.length} surveys have been removed from the list.`,
    })
  }

  const duplicateSurvey = (id: string) => {
    const surveyToDuplicate = allSurveys.find((survey) => survey.id === id)
    if (!surveyToDuplicate) return

    // Generate a unique temporary ID for the duplicated survey in the UI
    const newSurveyId = `${Date.now()}`;

    const newSurvey: Survey = {
      ...surveyToDuplicate,
      id: newSurveyId, // Assign the new temporary ID
      title: `${surveyToDuplicate.title} (Copy)`,
      // Reset response related fields for the duplicate
      responsesCount: 0,
      status: "draft", // Duplicates should start as draft
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssZ"), // Use ISO format as per API example
      updatedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssZ"), // Use ISO format
      publishedAt: undefined, // Duplicates are not published initially
      // You might need to handle questions and settings duplication based on API capabilities
      questions: [...surveyToDuplicate.questions], // Assuming questions can be copied directly
      settings: surveyToDuplicate.settings ? { ...surveyToDuplicate.settings, endDate: undefined, responseLimit: undefined } : undefined // Copy settings, reset time-sensitive ones
    }

    // Update state
    const updatedSurveys = [...allSurveys, newSurvey]
    setAllSurveys(updatedSurveys)

    toast({
      title: "Survey Duplicated",
      description: `"${newSurvey.title}" has been created.`,
    })

    // Note: This duplication is only client-side for UI purposes.
    // A real application would likely require an API call to duplicate the survey on the backend.
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Render loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading surveys...</div>;
  }

  // Render error state
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Surveys</h1>
          <p className="text-muted-foreground mt-1">Manage and analyze all your surveys</p>
        </div>
        <Link href="/surveys/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search surveys..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Checkbox id="status-active" className="mr-2" />
                <label htmlFor="status-active">Active</label>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Checkbox id="status-draft" className="mr-2" />
                <label htmlFor="status-draft">Draft</label>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Checkbox id="status-completed" className="mr-2" />
                <label htmlFor="status-completed">Completed</label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select defaultValue="newest">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="responses-high">Most Responses</SelectItem>
              <SelectItem value="responses-low">Least Responses</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="all">All Surveys</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {selectedSurveys.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedSurveys.length === filteredSurveys.length}
              onCheckedChange={selectAllSurveys}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              {selectedSurveys.length} selected
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSelectedSurveys}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {filteredSurveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No surveys found</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            We couldn't find any surveys matching your search. Try adjusting your filters or create a new survey.
          </p>
          <Link href="/surveys/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Survey
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedSurveys.length === filteredSurveys.length && filteredSurveys.length > 0}
                      onCheckedChange={selectAllSurveys}
                    />
                    <span>Survey</span>
                  </div>
                </th>
                <th className="text-left p-3 font-medium text-sm">Status</th>
                <th className="text-left p-3 font-medium text-sm">Responses</th>
                <th className="text-left p-3 font-medium text-sm">Completion</th>
                <th className="text-left p-3 font-medium text-sm">Created</th>
                <th className="text-left p-3 font-medium text-sm">Last Updated</th>
                <th className="text-right p-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((survey, index) => (
                <tr key={survey.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedSurveys.includes(survey.id)}
                        onCheckedChange={() => toggleSelectSurvey(survey.id)}
                      />
                      <div>
                        <div className="font-medium">{survey.title}</div>
                        {survey.description && <div className="text-sm text-muted-foreground">{survey.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{getStatusBadge(survey.status || '')}</td>
                  <td className="p-3">
                    {survey.responsesCount !== undefined ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{survey.responsesCount}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="p-3">
                    {survey.responsesCount !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${survey.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{survey.completionRate}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{survey.createdAt ? format(new Date(survey.createdAt), "MMM dd, yyyy") : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{survey.updatedAt ? format(new Date(survey.updatedAt), "MMM dd, yyyy") : 'N/A'}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/surveys/editor?id=${survey.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/surveys/analytics/${survey.id}`}>
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                      {survey.responsesCount !== undefined && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/surveys/results/${survey.id}`}>
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => duplicateSurvey(survey.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplicate</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => deleteSurvey(survey.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{filteredSurveys.length}</strong> of <strong>{surveys.length}</strong> surveys
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
